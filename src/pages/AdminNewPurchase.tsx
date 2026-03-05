import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, PlusCircle, ImagePlus } from "lucide-react";
import { DEFAULT_CATEGORIES } from "@/components/admin/ProductFormDialog";

/* ── Types ── */
interface PurchaseLine {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  qty: number;
  cost: number;
  amount: number;
}

interface ProductMaster {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  retail_price: number;
  cost_price: number;
  brand: string;
  category: string;
}

interface Supplier {
  id: string;
  name: string;
}

const uid = () => crypto.randomUUID();

const blankLine = (): PurchaseLine => ({
  id: uid(), product_id: "", name: "", sku: "", qty: 0, cost: 0, amount: 0,
});

const CATEGORY_PREFIX: Record<string, string> = {
  CLIMATISEUR: "CLM", CONGELATEUR: "CNG", FRIGO: "FRG",
  "MACHINE A LAVER": "MAL", TELEVISEUR: "TV", VENTILATEUR: "VNT",
  "MICRO ONDE": "MIC", CUISINIERE: "CUI", REGULATEUR: "REG",
  "FER A REPASSER": "FER", "AIR COOLER": "ACL", "DISPENSEUR EAU": "DEU",
  "ROBOT MIXEUR": "RMX", "CHAUFFE-EAU": "CHE", "SECHE-LINGE": "SCL",
  "CAVE A VIN": "CAV", AUTRES: "AUT",
};

/* ── Component ── */
const AdminNewPurchase = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  /* Suppliers */
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState("");

  /* Voucher header */
  const [invoiceNo, setInvoiceNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));

  /* Lines */
  const [lines, setLines] = useState<PurchaseLine[]>([blankLine()]);
  const [activeRow, setActiveRow] = useState(0);
  const [activeCol, setActiveCol] = useState(0);

  /* Autocomplete */
  const [acQuery, setAcQuery] = useState("");
  const [acResults, setAcResults] = useState<ProductMaster[]>([]);
  const [acOpen, setAcOpen] = useState(false);
  const [acIndex, setAcIndex] = useState(0);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  /* New product modal */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductSku, setNewProductSku] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const [newProductBrand, setNewProductBrand] = useState("");
  const [newProductCostPrice, setNewProductCostPrice] = useState(0);
  const [newProductRetailPrice, setNewProductRetailPrice] = useState(0);
  const [newProductWholesalePrice, setNewProductWholesalePrice] = useState(0);
  const [newProductReorderLevel, setNewProductReorderLevel] = useState(0);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [createForRow, setCreateForRow] = useState(0);

  /* New product image */
  const [newProductImage, setNewProductImage] = useState<File | null>(null);
  const [newProductImagePreview, setNewProductImagePreview] = useState<string | null>(null);
  const newProductImageRef = useRef<HTMLInputElement>(null);

  /* Missing images banner */
  const [missingImgCount, setMissingImgCount] = useState(0);

  /* Processing */
  const [isProcessing, setIsProcessing] = useState(false);

  /* Refs */
  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const setCellRef = (row: number, col: number, el: HTMLInputElement | null) => {
    cellRefs.current[`${row}-${col}`] = el;
  };
  const focusCell = (row: number, col: number) => {
    setTimeout(() => cellRefs.current[`${row}-${col}`]?.focus(), 30);
  };

  /* Load suppliers */
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("suppliers").select("id, name").order("name");
      setSuppliers(data ?? []);
    };
    load();
  }, []);

  /* Missing images count */
  useEffect(() => {
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .or("image_url.is.null,image_url.eq.")
      .then(({ count }) => setMissingImgCount(count ?? 0));
  }, []);

  /* Autocomplete search */
  useEffect(() => {
    if (!acOpen || acQuery.length < 1) { setAcResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, sku, barcode, retail_price, cost_price, brand, category")
        .eq("is_active", true)
        .or(`name.ilike.%${acQuery}%,sku.ilike.%${acQuery}%,barcode.ilike.%${acQuery}%`)
        .limit(15);
      setAcResults((data as ProductMaster[]) ?? []);
      setAcIndex(0);
    }, 150);
    return () => clearTimeout(timer);
  }, [acQuery, acOpen]);

  /* Update line helper */
  const updateLine = useCallback((row: number, field: keyof PurchaseLine, value: number) => {
    setLines(prev => {
      const next = [...prev];
      const line = { ...next[row], [field]: value };
      if (field === "qty") line.amount = line.qty * line.cost;
      if (field === "cost") line.amount = line.qty * line.cost;
      if (field === "amount" && line.qty > 0) line.cost = value / line.qty;
      next[row] = line;
      return next;
    });
  }, []);

  /* Select product */
  const selectProduct = (product: ProductMaster, row: number) => {
    setLines(prev => {
      const next = [...prev];
      next[row] = {
        ...next[row],
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        qty: 1,
        cost: Number(product.cost_price),
        amount: Number(product.cost_price),
      };
      return next;
    });
    setAcOpen(false);
    setAcQuery("");
    // Add blank line if last row
    if (row === lines.length - 1) {
      setLines(prev => [...prev, blankLine()]);
    }
    focusCell(row, 1); // focus qty
  };

  /* Open create product modal */
  const openCreateModal = (row: number) => {
    const currentLine = lines[row];
    setCreateForRow(row);
    setNewProductName(acQuery);
    setNewProductSku("");
    setNewProductCategory("");
    setNewProductBrand("");
    setNewProductCostPrice(currentLine.cost || 0);
    setNewProductRetailPrice(0);
    setNewProductWholesalePrice(0);
    setNewProductReorderLevel(0);
    setNewProductImage(null);
    setNewProductImagePreview(null);
    setShowCreateModal(true);
    setAcOpen(false);
  };

  /* Create product */
  const handleCreateProduct = async () => {
    if (!newProductName.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    if (!newProductCategory) {
      toast({ title: "Category is required", variant: "destructive" });
      return;
    }

    setIsCreatingProduct(true);

    // Auto-generate SKU if blank
    const sku = newProductSku.trim() || `${CATEGORY_PREFIX[newProductCategory] || "GEN"}-${Date.now()}`;

    try {
      const { data, error } = await supabase.functions.invoke("manage-products-master", {
        body: {
          sku,
          name: newProductName.trim(),
          category: newProductCategory,
          brand: newProductBrand.trim() || "Generic",
          cost_price: newProductCostPrice,
          retail_price: newProductRetailPrice,
          wholesale_price: newProductWholesalePrice,
          reorder_level: newProductReorderLevel,
        },
      });

      if (error || data?.error) {
        toast({ title: data?.error || error?.message || "Failed to create product", variant: "destructive" });
        return;
      }

      // Upload image if one was selected
      if (newProductImage && data.id) {
        const ext = newProductImage.name.split(".").pop() ?? "jpg";
        const imgPath = `products/${data.id}.${ext}`;
        const { error: imgErr } = await supabase.storage
          .from("product-images")
          .upload(imgPath, newProductImage, { upsert: true });
        if (!imgErr) {
          const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(imgPath);
          await supabase.from("products").update({ image_url: urlData.publicUrl }).eq("id", data.id);
        }
      }

      // Fetch the newly created product
      const { data: newProduct } = await supabase
        .from("products")
        .select("id, name, sku, barcode, retail_price, cost_price, brand, category")
        .eq("id", data.id)
        .single();

      if (newProduct) {
        selectProduct(newProduct as ProductMaster, createForRow);
        toast({ title: `Product "${newProduct.name}" created` });
      }

      setShowCreateModal(false);
      setNewProductImage(null);
      setNewProductImagePreview(null);
    } catch (e: any) {
      toast({ title: e.message || "Error creating product", variant: "destructive" });
    } finally {
      setIsCreatingProduct(false);
    }
  };

  /* Keyboard navigation */
  const handleCellKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (col === 0 && acOpen && acResults.length > 0) {
        selectProduct(acResults[acIndex], row);
        return;
      }
      // Move to next cell
      if (col < 3) {
        focusCell(row, col + 1);
        setActiveCol(col + 1);
      } else {
        // Move to next row item name
        const nextRow = row + 1;
        if (nextRow >= lines.length) setLines(prev => [...prev, blankLine()]);
        setActiveRow(nextRow);
        setActiveCol(0);
        focusCell(nextRow, 0);
      }
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      if (col > 0) { focusCell(row, col - 1); setActiveCol(col - 1); }
      else if (row > 0) { focusCell(row - 1, 3); setActiveRow(row - 1); setActiveCol(3); }
    } else if (e.key === "ArrowDown" && col === 0 && acOpen) {
      e.preventDefault();
      setAcIndex(i => Math.min(i + 1, acResults.length - 1));
    } else if (e.key === "ArrowUp" && col === 0 && acOpen) {
      e.preventDefault();
      setAcIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Escape" && acOpen) {
      setAcOpen(false);
    }
  };

  /* Totals */
  const total = useMemo(() => lines.reduce((s, l) => s + l.amount, 0), [lines]);
  const filledLines = useMemo(() => lines.filter(l => l.product_id), [lines]);

  /* Submit */
  const handleSubmit = async () => {
    if (!supplierId) { toast({ title: "Select a supplier", variant: "destructive" }); return; }
    if (!invoiceNo.trim()) { toast({ title: "Invoice number required", variant: "destructive" }); return; }
    if (filledLines.length === 0) { toast({ title: "Add at least one item", variant: "destructive" }); return; }

    for (const l of filledLines) {
      if (l.qty <= 0) { toast({ title: `Qty must be > 0 for ${l.name}`, variant: "destructive" }); return; }
      if (l.cost < 0) { toast({ title: `Cost must be >= 0 for ${l.name}`, variant: "destructive" }); return; }
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-purchases", {
        body: {
          supplier_id: supplierId,
          invoice_number: invoiceNo.trim(),
          purchase_date: purchaseDate,
          items: filledLines.map(l => ({
            product_id: l.product_id,
            quantity: l.qty,
            cost_per_unit: l.cost,
          })),
        },
      });

      if (error || data?.error) {
        toast({ title: data?.error || error?.message || "Purchase failed", variant: "destructive" });
        return;
      }

      toast({ title: `Purchase recorded! ${data.items_processed} items processed.` });
      // Reset
      setLines([blankLine()]);
      setInvoiceNo("");
      setActiveRow(0);
      setActiveCol(0);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const storeId = supplierId; // not used but keeps pattern

  return (
    <div className="space-y-4">
      {missingImgCount > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm text-orange-800 mb-4">
          <ImagePlus className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            <strong>{missingImgCount}</strong> product{missingImgCount !== 1 ? "s are" : " is"} missing images.
          </span>
          <a href="/admin/inventory" className="text-orange-700 underline text-xs font-medium hover:text-orange-900">
            Upload Images →
          </a>
        </div>
      )}

      <h1 className="text-lg font-bold">Purchase Voucher</h1>

      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-muted/50 border rounded-lg p-3">
        <div>
          <Label className="text-xs text-muted-foreground">Supplier</Label>
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select supplier" /></SelectTrigger>
            <SelectContent>
              {suppliers.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Invoice No</Label>
          <Input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className="h-9" placeholder="INV-XXX" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Date</Label>
          <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="h-9" />
        </div>
        <div className="flex items-end">
          <div className="text-right w-full">
            <span className="text-xs text-muted-foreground">Total</span>
            <p className="text-lg font-bold">{new Intl.NumberFormat("fr-FR").format(Math.round(total))} FCFA</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/70 text-left text-xs text-muted-foreground">
              <th className="border border-border px-2 py-1.5 w-8 text-center">#</th>
              <th className="border border-border px-2 py-1.5">Item Name</th>
              <th className="border border-border px-2 py-1.5 w-24 text-right">Qty</th>
              <th className="border border-border px-2 py-1.5 w-28 text-right">Cost/Unit</th>
              <th className="border border-border px-2 py-1.5 w-32 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, row) => {
              const isActive = activeRow === row;
              return (
                <tr key={line.id} className={isActive ? "bg-primary/5" : ""} onClick={() => setActiveRow(row)}>
                  <td className="border border-border px-2 py-1 text-center text-xs text-muted-foreground">{row + 1}</td>
                  {/* Item Name */}
                  <td className="border border-border px-0 py-0">
                    <input
                      ref={el => setCellRef(row, 0, el)}
                      type="text"
                      value={isActive && activeCol === 0 && acOpen ? acQuery : line.name}
                      onChange={e => {
                        setAcQuery(e.target.value);
                        setAcOpen(true);
                      }}
                      onFocus={e => {
                        setActiveRow(row);
                        setActiveCol(0);
                        if (line.product_id) {
                          setAcQuery(line.name);
                        }
                        const rect = e.target.getBoundingClientRect();
                        setDropdownPos({ top: rect.bottom, left: rect.left, width: Math.max(rect.width, 500) });
                      }}
                      onBlur={() => setTimeout(() => setAcOpen(false), 200)}
                      onKeyDown={e => handleCellKeyDown(e, row, 0)}
                      className="w-full px-2 py-1.5 bg-transparent outline-none text-sm"
                      placeholder="Search product..."
                    />
                  </td>
                  {/* Qty */}
                  <td className="border border-border px-0 py-0">
                    <input
                      ref={el => setCellRef(row, 1, el)}
                      type="number"
                      value={line.product_id ? line.qty : ""}
                      onChange={e => updateLine(row, "qty", parseInt(e.target.value) || 0)}
                      onFocus={e => { setActiveRow(row); setActiveCol(1); e.target.select(); }}
                      onKeyDown={e => handleCellKeyDown(e, row, 1)}
                      className="w-full px-2 py-1.5 bg-transparent outline-none text-sm text-right"
                      disabled={!line.product_id}
                    />
                  </td>
                  {/* Cost */}
                  <td className="border border-border px-0 py-0">
                    <input
                      ref={el => setCellRef(row, 2, el)}
                      type="number"
                      value={line.product_id ? line.cost : ""}
                      onChange={e => updateLine(row, "cost", parseFloat(e.target.value) || 0)}
                      onFocus={e => { setActiveRow(row); setActiveCol(2); e.target.select(); }}
                      onKeyDown={e => handleCellKeyDown(e, row, 2)}
                      className="w-full px-2 py-1.5 bg-transparent outline-none text-sm text-right"
                      disabled={!line.product_id}
                    />
                  </td>
                  {/* Amount */}
                  <td className="border border-border px-0 py-0">
                    <input
                      ref={el => setCellRef(row, 3, el)}
                      type="number"
                      value={line.product_id ? line.amount : ""}
                      onChange={e => updateLine(row, "amount", parseFloat(e.target.value) || 0)}
                      onFocus={e => { setActiveRow(row); setActiveCol(3); e.target.select(); }}
                      onKeyDown={e => handleCellKeyDown(e, row, 3)}
                      className="w-full px-2 py-1.5 bg-transparent outline-none text-sm text-right"
                      disabled={!line.product_id}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isProcessing || filledLines.length === 0} size="lg">
          {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : "Save Purchase"}
        </Button>
      </div>

      {/* Autocomplete Dropdown */}
      {acOpen && dropdownPos && activeCol === 0 && createPortal(
        <div
          className="fixed z-[9999] max-h-[300px] overflow-y-auto rounded-md border bg-background shadow-lg"
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
        >
          {acResults.length === 0 && acQuery.length >= 1 ? (
            <div className="p-2 space-y-1">
              <p className="text-xs text-muted-foreground px-1">No products found for "{acQuery}"</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-sm"
                onMouseDown={e => { e.preventDefault(); openCreateModal(activeRow); }}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Product
              </Button>
            </div>
          ) : (
            acResults.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center justify-between px-2 py-1.5 cursor-pointer text-xs font-mono ${
                  i === acIndex ? "bg-primary/10" : "hover:bg-muted"
                }`}
                onMouseDown={e => { e.preventDefault(); selectProduct(p, activeRow); }}
                onMouseEnter={() => setAcIndex(i)}
              >
                <div>
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground ml-2">{p.sku}</span>
                </div>
                <span className="text-muted-foreground">{Number(p.cost_price).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>,
        document.body
      )}

      {/* Create Product Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">SKU <span className="text-muted-foreground">(auto-generated if blank)</span></Label>
              <Input value={newProductSku} onChange={e => setNewProductSku(e.target.value)} placeholder="Leave blank to auto-generate" className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Name <span className="text-destructive">*</span></Label>
              <Input value={newProductName} onChange={e => setNewProductName(e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Category <span className="text-destructive">*</span></Label>
              <Select value={newProductCategory} onValueChange={setNewProductCategory}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {DEFAULT_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Brand</Label>
              <Input value={newProductBrand} onChange={e => setNewProductBrand(e.target.value)} placeholder="Generic" className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Cost Price</Label>
                <Input type="number" value={newProductCostPrice} onChange={e => setNewProductCostPrice(parseFloat(e.target.value) || 0)} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Retail Price</Label>
                <Input type="number" value={newProductRetailPrice} onChange={e => setNewProductRetailPrice(parseFloat(e.target.value) || 0)} className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Wholesale Price</Label>
                <Input type="number" value={newProductWholesalePrice} onChange={e => setNewProductWholesalePrice(parseFloat(e.target.value) || 0)} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Reorder Level</Label>
                <Input type="number" value={newProductReorderLevel} onChange={e => setNewProductReorderLevel(parseInt(e.target.value) || 0)} className="h-9" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Product Image <span className="text-muted-foreground">(optional - can upload later)</span></Label>
              <div className="flex items-center gap-3 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => newProductImageRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  {newProductImage ? "Change Image" : "Upload Image"}
                </Button>
                {newProductImage && (
                  <span className="text-xs text-green-700 font-medium">{newProductImage.name}</span>
                )}
                {!newProductImage && (
                  <span className="text-xs text-muted-foreground">Leave blank to upload later</span>
                )}
              </div>
              {newProductImagePreview && (
                <img
                  src={newProductImagePreview}
                  alt="Preview"
                  className="mt-2 h-20 w-20 object-cover rounded border"
                />
              )}
              <input
                ref={newProductImageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setNewProductImage(file);
                  setNewProductImagePreview(URL.createObjectURL(file));
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={isCreatingProduct}>Cancel</Button>
            <Button onClick={handleCreateProduct} disabled={isCreatingProduct}>
              {isCreatingProduct ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create & Select"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNewPurchase;
