import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import BarcodeScanner from "@/components/admin/BarcodeScanner";
import POSPrintInvoice from "@/components/admin/POSPrintInvoice";

/* ── Types ── */
interface VoucherLine {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  qty: number;
  rate: number;
  amount: number;
  stock: number;
}

interface ProductMaster {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  retail_price: number;
  wholesale_price: number;
  brand: string;
  category: string;
}

interface Location {
  id: string;
  name: string;
  type: string;
}

const uid = () => crypto.randomUUID();

const blankLine = (): VoucherLine => ({
  id: uid(),
  product_id: "",
  name: "",
  sku: "",
  qty: 0,
  rate: 0,
  amount: 0,
  stock: 0,
});

/* ── Component ── */
const POS = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const routeLocation = useLocation();
  const routeNavigate = useNavigate();
  const editState = routeLocation.state as {
    editMode?: boolean;
    oldSaleId?: string;
    storeId?: string;
    customerName?: string;
    narration?: string;
    paymentMethod?: string;
    items?: { product_id: string; name: string; sku: string; qty: number; rate: number; amount: number }[];
  } | null;

  /* Edit mode tracking */
  const [oldSaleId, setOldSaleId] = useState<string | null>(editState?.oldSaleId ?? null);

  /* Store */
  const [stores, setStores] = useState<Location[]>([]);
  const [store, setStore] = useState<Location | null>(null);

  /* Voucher header */
  const [invoiceNo] = useState(`INV-${Date.now()}`);
  const [voucherDate, setVoucherDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [editingDate, setEditingDate] = useState(false);
  const dateRef = useRef<HTMLInputElement>(null);

  /* Lines */
  const [lines, setLines] = useState<VoucherLine[]>([blankLine()]);
  const [activeRow, setActiveRow] = useState(0);
  const [activeCol, setActiveCol] = useState(0); // 0=name,1=qty,2=rate,3=amount

  /* Autocomplete */
  const [acQuery, setAcQuery] = useState("");
  const [acResults, setAcResults] = useState<ProductMaster[]>([]);
  const [acStockMap, setAcStockMap] = useState<Record<string, number>>({});
  const [acOpen, setAcOpen] = useState(false);
  const [acIndex, setAcIndex] = useState(0);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  /* Footer fields */
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [gridExited, setGridExited] = useState(false);

  /* Optional fields */
  const [showCustomer, setShowCustomer] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [narration, setNarration] = useState("");

  /* Processing */
  const [isProcessing, setIsProcessing] = useState(false);

  /* Last confirmed sale data (for print invoice) */
  const [lastSaleData, setLastSaleData] = useState<{
    invoiceNo: string;
    voucherDate: string;
    storeName: string;
    customerName: string;
    lines: { product_id: string; name: string; sku: string; qty: number; rate: number; amount: number }[];
    subtotal: number;
    discount: number;
    grandTotal: number;
    paymentMethod: string;
  } | null>(null);

  /* Refs for grid cells */
  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const editMode = useRef<Record<string, boolean>>({});
  const discountRef = useRef<HTMLInputElement>(null);
  const paymentRef = useRef<HTMLSelectElement>(null);
  const saveBtnRef = useRef<HTMLButtonElement>(null);
  const setCellRef = (row: number, col: number, el: HTMLInputElement | null) => {
    cellRefs.current[`${row}-${col}`] = el;
  };
  const focusCell = (row: number, col: number) => {
    setTimeout(() => {
      const el = cellRefs.current[`${row}-${col}`];
      if (el) {
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    }, 0);
  };

  const exitGrid = () => {
    setGridExited(true);
    setTimeout(() => discountRef.current?.focus(), 0);
  };

  const returnToGrid = () => {
    setGridExited(false);
    const lastFilledRow = lines.reduce((last, l, i) => l.product_id ? i : last, -1);
    const targetRow = lastFilledRow >= 0 ? lastFilledRow : lines.length - 1;
    setActiveRow(targetRow);
    setActiveCol(0);
    focusCell(targetRow, 0);
  };

  const storeId = store?.id ?? "";

  /* Load stores + handle edit prefill */
  useEffect(() => {
    const fetchStores = async () => {
      const { data } = await supabase
        .from("locations")
        .select("id, name, type")
        .eq("type", "store");
      if (data && data.length > 0) {
        setStores(data);
        if (editState?.editMode && editState.storeId) {
          const editStore = data.find((s) => s.id === editState.storeId);
          setStore(editStore ?? data[0]);
        } else {
          setStore(data[0]);
        }
      }
    };
    fetchStores();

    // Prefill from edit state
    if (editState?.editMode && editState.items) {
      const prefilled: VoucherLine[] = editState.items.map((i) => ({
        id: uid(),
        product_id: i.product_id,
        name: i.name,
        sku: i.sku,
        qty: i.qty,
        rate: i.rate,
        amount: i.amount,
        stock: 0,
      }));
      prefilled.push(blankLine());
      setLines(prefilled);
      if (editState.customerName) {
        setShowCustomer(true);
        setCustomerName(editState.customerName);
      }
      if (editState.narration) setNarration(editState.narration);
      if (editState.paymentMethod) setPaymentMethod(editState.paymentMethod);
      // Clear route state to prevent re-prefill on re-render
      window.history.replaceState({}, document.title);
    }
  }, []);

  /* Global keyboard shortcuts */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        setEditingDate(true);
        setTimeout(() => dateRef.current?.focus(), 0);
      } else if (e.key === "F4") {
        e.preventDefault();
        saveVoucher();
      } else if (e.key === "Escape") {
        e.preventDefault();
        clearVoucher();
      } else if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        deleteRow(activeRow);
      } else if (e.ctrlKey && e.key === "a") {
        e.preventDefault();
        insertRowAfter(activeRow);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  /* ── Autocomplete search via useEffect (debounced) ── */
  useEffect(() => {
    if (acQuery.length < 1) {
      setAcResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, sku, barcode, retail_price, wholesale_price, brand, category")
        .eq("is_active", true)
        .or(`name.ilike.%${acQuery}%,sku.ilike.%${acQuery}%,barcode.ilike.%${acQuery}%`)
        .limit(10);
      if (data) {
        setAcResults(data);
        setAcIndex(0);
        if (storeId && data.length > 0) {
          const ids = data.map((p) => p.id);
          const { data: inv } = await supabase
            .from("inventory")
            .select("product_id, quantity")
            .eq("location_id", storeId)
            .in("product_id", ids);
          const map: Record<string, number> = {};
          inv?.forEach((i) => (map[i.product_id] = i.quantity));
          setAcStockMap((prev) => ({ ...prev, ...map }));
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [acQuery, storeId]);

  /* ── Select product into line ── */
  const selectProduct = async (product: ProductMaster, row: number) => {
    const stock = acStockMap[product.id] ?? 0;
    let rate = Number(product.retail_price);

    // Check last sale price at current store
    if (storeId) {
      const { data: lastSale } = await supabase
        .from("sale_items")
        .select("selling_price, sale:sales!inner(store_id, status)")
        .eq("product_id", product.id)
        .eq("sale.store_id", storeId)
        .eq("sale.status", "active")
        .order("created_at", { ascending: false })
        .limit(1);

      if (lastSale && lastSale.length > 0) {
        rate = Number(lastSale[0].selling_price);
      }
    }

    setLines((prev) => {
      const next = [...prev];
      next[row] = {
        ...next[row],
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        qty: 1,
        rate,
        amount: rate,
        stock,
      };
      return next;
    });
    setAcOpen(false);
    setAcQuery("");
    setAcResults([]);
    // Move to qty
    setActiveCol(1);
    focusCell(row, 1);
  };

  /* ── Line updates ── */
  const updateLine = (row: number, field: "qty" | "rate" | "amount", value: number) => {
    setLines((prev) => {
      const next = [...prev];
      const line = { ...next[row] };
      if (field === "qty") {
        line.qty = value;
        line.amount = Math.round(value * line.rate * 100) / 100;
      } else if (field === "rate") {
        line.rate = value;
        line.amount = Math.round(line.qty * value * 100) / 100;
      } else if (field === "amount") {
        line.amount = value;
        if (line.qty > 0) {
          line.rate = Math.round((value / line.qty) * 100) / 100;
        }
      }
      next[row] = line;
      return next;
    });
  };

  /* ── Row operations ── */
  const insertRowAfter = (row: number) => {
    setLines((prev) => {
      const next = [...prev];
      next.splice(row + 1, 0, blankLine());
      return next;
    });
    setActiveRow(row + 1);
    setActiveCol(0);
    focusCell(row + 1, 0);
  };

  const deleteRow = (row: number) => {
    if (lines.length <= 1) {
      setLines([blankLine()]);
      setActiveRow(0);
      setActiveCol(0);
      focusCell(0, 0);
      return;
    }
    setLines((prev) => prev.filter((_, i) => i !== row));
    const newRow = Math.min(row, lines.length - 2);
    setActiveRow(newRow);
    focusCell(newRow, activeCol);
  };

  /* ── Navigation ── */
  const navigate = (row: number, col: number, direction: "next" | "prev") => {
    if (direction === "next") {
      if (col < 3) {
        // Skip qty/rate/amount if no product selected
        const nextCol = col + 1;
        setActiveCol(nextCol);
        focusCell(row, nextCol);
      } else {
        // col === 3 (amount), create new row
        if (row === lines.length - 1) {
          insertRowAfter(row);
        } else {
          setActiveRow(row + 1);
          setActiveCol(0);
          focusCell(row + 1, 0);
        }
      }
    } else {
      if (col > 0) {
        setActiveCol(col - 1);
        focusCell(row, col - 1);
      } else if (row > 0) {
        setActiveRow(row - 1);
        setActiveCol(3);
        focusCell(row - 1, 3);
      }
    }
  };

  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    row: number,
    col: number
  ) => {
    const key = `${row}-${col}`;
    // Any printable character or numeric input activates edit mode
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      editMode.current[key] = true;
    }

    if (e.key === "Backspace") {
      if (!editMode.current[key]) {
        e.preventDefault();
        navigate(row, col, "prev");
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      navigate(row, col, "next");
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      navigate(row, col, "prev");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (row < lines.length - 1) {
        setActiveRow(row + 1);
        focusCell(row + 1, col);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (row > 0) {
        setActiveRow(row - 1);
        focusCell(row - 1, col);
      }
    }
  };

  /* ── Totals ── */
  const filledLines = lines.filter((l) => l.product_id);
  const subtotal = filledLines.reduce((s, l) => s + l.amount, 0);
  const grandTotal = Math.max(subtotal - discount, 0);

  /* ── Save voucher ── */
  const saveVoucher = async () => {
    if (!storeId) return;
    if (filledLines.length === 0) {
      toast({ title: "No items", description: "Add at least one item.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    // Capture sale data snapshot before clearing
    const saleSnapshot = {
      invoiceNo,
      voucherDate,
      storeName: store?.name ?? "",
      customerName: showCustomer ? customerName.trim() : "",
      lines: filledLines.map((l) => ({
        product_id: l.product_id,
        name: l.name,
        sku: l.sku,
        qty: l.qty,
        rate: l.rate,
        amount: l.amount,
      })),
      subtotal,
      discount,
      grandTotal,
      paymentMethod,
    };
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-sales`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
           body: JSON.stringify({
             store_id: storeId,
             invoice_number: `INV-${Date.now()}`,
             sale_date: voucherDate,
             payment_method: paymentMethod,
             ...(showCustomer && customerName.trim() ? { customer_name: customerName.trim() } : {}),
             ...(narration.trim() ? { narration: narration.trim() } : {}),
             ...(oldSaleId ? { old_sale_id: oldSaleId } : {}),
             items: filledLines.map((l) => ({
               product_id: l.product_id,
               quantity: l.qty,
               selling_price: l.rate,
             })),
           }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Sale failed");
      toast({
        title: "Voucher saved",
        description: `Total: ${grandTotal.toLocaleString()} CFA`,
      });
      setLastSaleData(saleSnapshot);
      clearVoucher();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearVoucher = () => {
    setLines([blankLine()]);
    setActiveRow(0);
    setActiveCol(0);
    setDiscount(0);
    setPaymentMethod("cash");
    setGridExited(false);
    setShowCustomer(false);
    setCustomerName("");
    setNarration("");
    setOldSaleId(null);
    focusCell(0, 0);
  };

  /* ── Barcode scan handler ── */
  const handleBarcodeScan = useCallback(async (code: string) => {
    const { data } = await supabase
      .from("products")
      .select("id, name, sku, barcode, retail_price, wholesale_price, brand, category")
      .eq("is_active", true)
      .or(`barcode.eq.${code},sku.eq.${code}`)
      .limit(1)
      .maybeSingle();

    if (!data) {
      toast({ title: "Product not found", description: `No product with barcode ${code}`, variant: "destructive" });
      return;
    }
    await selectProduct(data as ProductMaster, activeRow);
  }, [activeRow, storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Render ── */
  return (
    <div className="h-full flex flex-col bg-white text-sm text-foreground font-mono">
      {/* Edit mode banner */}
      {oldSaleId && (
        <div className="bg-amber-100 border-b border-amber-300 px-4 py-1.5 text-xs text-amber-800 font-medium flex items-center justify-between">
          <span>✏️ Editing sale — original has been reversed. Save to create replacement.</span>
          <button onClick={clearVoucher} className="underline text-amber-700 hover:text-amber-900">Cancel edit</button>
        </div>
      )}
      {/* Header */}
      <div className="border-b border-neutral-300 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-base tracking-tight">Sales Voucher</span>
          <span className="text-muted-foreground">{store?.name ?? "—"}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <BarcodeScanner onDetected={handleBarcodeScan} />
          <span>No: <span className="text-foreground font-medium">{invoiceNo}</span></span>
          <span>
            Date:{" "}
            {editingDate ? (
              <input
                ref={dateRef}
                type="date"
                value={voucherDate}
                onChange={(e) => setVoucherDate(e.target.value)}
                onBlur={() => setEditingDate(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Escape") {
                    setEditingDate(false);
                  }
                }}
                className="border border-neutral-300 px-1 py-0.5 text-xs bg-white outline-none"
              />
            ) : (
              <button
                onClick={() => setEditingDate(true)}
                className="text-foreground font-medium underline decoration-dotted cursor-pointer"
              >
                {voucherDate}
              </button>
            )}
            <span className="ml-1 text-[10px] border border-neutral-300 rounded px-1 py-0.5">F2</span>
          </span>
        </div>
      </div>

      {/* Last sale print banner */}
      {lastSaleData && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-1.5 flex items-center justify-between text-xs text-green-800">
          <span className="font-medium">
            Sale saved — {lastSaleData.invoiceNo} | Total: {lastSaleData.grandTotal.toLocaleString()} CFA
          </span>
          <div className="flex items-center gap-2">
            <POSPrintInvoice
              invoiceNo={lastSaleData.invoiceNo}
              voucherDate={lastSaleData.voucherDate}
              storeName={lastSaleData.storeName}
              customerName={lastSaleData.customerName}
              lines={lastSaleData.lines}
              subtotal={lastSaleData.subtotal}
              discount={lastSaleData.discount}
              grandTotal={lastSaleData.grandTotal}
              paymentMethod={lastSaleData.paymentMethod}
            />
            <button
              onClick={() => setLastSaleData(null)}
              className="text-green-600 hover:text-green-900 underline text-[10px]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Shortcuts bar */}
      <div className="border-b border-neutral-200 px-4 py-1 flex gap-4 text-[10px] text-muted-foreground bg-neutral-50">
        <span><kbd className="border border-neutral-300 rounded px-1 py-0.5 text-[9px]">Enter</kbd> Next</span>
        <span><kbd className="border border-neutral-300 rounded px-1 py-0.5 text-[9px]">Shift+Enter</kbd> Prev</span>
        <span><kbd className="border border-neutral-300 rounded px-1 py-0.5 text-[9px]">Ctrl+A</kbd> New row</span>
        <span><kbd className="border border-neutral-300 rounded px-1 py-0.5 text-[9px]">Ctrl+D</kbd> Delete row</span>
        <span><kbd className="border border-neutral-300 rounded px-1 py-0.5 text-[9px]">F4</kbd> Save</span>
        <span><kbd className="border border-neutral-300 rounded px-1 py-0.5 text-[9px]">Esc</kbd> Cancel</span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-neutral-100 text-left text-xs text-muted-foreground">
              <th className="border border-neutral-300 px-2 py-1.5 w-8 text-center">#</th>
              <th className="border border-neutral-300 px-2 py-1.5">Item Name</th>
              <th className="border border-neutral-300 px-2 py-1.5 w-24 text-right">Qty</th>
              <th className="border border-neutral-300 px-2 py-1.5 w-28 text-right">Rate</th>
              <th className="border border-neutral-300 px-2 py-1.5 w-32 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, row) => {
              const isActive = activeRow === row;
              return (
                <tr
                  key={line.id}
                  className={isActive ? "bg-blue-50/60" : ""}
                  onClick={() => setActiveRow(row)}
                >
                  <td className="border border-neutral-300 px-2 py-1 text-center text-xs text-muted-foreground">
                    {row + 1}
                  </td>

                  {/* Item Name */}
                  <td className="border border-neutral-300 px-0 py-0">
                    <input
                      ref={(el) => setCellRef(row, 0, el)}
                      value={line.product_id ? line.name : (isActive && activeCol === 0 ? acQuery : "")}
                      onChange={(e) => {
                        setActiveRow(row);
                        setActiveCol(0);
                        if (line.product_id) {
                          setLines((prev) => {
                            const next = [...prev];
                            next[row] = { ...blankLine(), id: line.id };
                            return next;
                          });
                        }
                        setAcQuery(e.target.value);
                        if (e.target.value.length >= 1) setAcOpen(true);
                        else setAcOpen(false);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDropdownPos({ top: rect.bottom, left: rect.left, width: Math.max(rect.width, 500) });
                      }}
                      onFocus={(e) => {
                        editMode.current[`${row}-0`] = false;
                        setActiveRow(row);
                        setActiveCol(0);
                        if (!line.product_id) setAcQuery("");
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDropdownPos({ top: rect.bottom, left: rect.left, width: Math.max(rect.width, 500) });
                      }}
                      onBlur={() => {
                        editMode.current[`${row}-0`] = false;
                        setTimeout(() => setAcOpen(false), 200);
                      }}
                      onKeyDown={(e) => {
                        if (acOpen && e.key === "ArrowDown") {
                          e.preventDefault();
                          setAcIndex((i) => Math.min(i + 1, acResults.length - 1));
                        } else if (acOpen && e.key === "ArrowUp") {
                          e.preventDefault();
                          setAcIndex((i) => Math.max(i - 1, 0));
                        } else if (acOpen && e.key === "Enter") {
                          e.preventDefault();
                          if (acResults[acIndex]) selectProduct(acResults[acIndex], row);
                        } else if (e.key === "Escape" && acOpen) {
                          e.preventDefault();
                          setAcOpen(false);
                        } else if (!line.product_id && !acOpen && (e.key === "Enter" || e.key === "ArrowDown")) {
                          // Blank row + Enter/ArrowDown → exit grid
                          e.preventDefault();
                          exitGrid();
                        } else {
                          handleCellKeyDown(e, row, 0);
                        }
                      }}
                      className="w-full px-2 py-1.5 bg-transparent outline-none text-sm"
                      placeholder="Type to search..."
                      autoComplete="off"
                    />
                  </td>


                  {/* Qty */}
                  <td className="border border-neutral-300 px-0 py-0">
                    <input
                      ref={(el) => setCellRef(row, 1, el)}
                      type="number"
                      value={line.product_id ? line.qty : ""}
                      onChange={(e) => {
                        updateLine(row, "qty", parseInt(e.target.value) || 0);
                      }}
                      onFocus={(e) => {
                        editMode.current[`${row}-1`] = false;
                        setActiveRow(row);
                        setActiveCol(1);
                        e.target.select();
                      }}
                      onBlur={() => { editMode.current[`${row}-1`] = false; }}
                      onKeyDown={(e) => handleCellKeyDown(e, row, 1)}
                      className="w-full px-2 py-1.5 bg-transparent outline-none text-sm text-right"
                      disabled={!line.product_id}
                    />
                  </td>

                  {/* Rate */}
                  <td className="border border-neutral-300 px-0 py-0">
                    <input
                      ref={(el) => setCellRef(row, 2, el)}
                      type="number"
                      value={line.product_id ? line.rate : ""}
                      onChange={(e) => {
                        updateLine(row, "rate", parseFloat(e.target.value) || 0);
                      }}
                      onFocus={(e) => {
                        editMode.current[`${row}-2`] = false;
                        setActiveRow(row);
                        setActiveCol(2);
                        e.target.select();
                      }}
                      onBlur={() => { editMode.current[`${row}-2`] = false; }}
                      onKeyDown={(e) => handleCellKeyDown(e, row, 2)}
                      className="w-full px-2 py-1.5 bg-transparent outline-none text-sm text-right"
                      disabled={!line.product_id}
                    />
                  </td>

                  {/* Amount */}
                  <td className="border border-neutral-300 px-0 py-0 relative">
                    <input
                      ref={(el) => setCellRef(row, 3, el)}
                      type="number"
                      value={line.product_id ? line.amount : ""}
                      onChange={(e) => {
                        updateLine(row, "amount", parseFloat(e.target.value) || 0);
                      }}
                      onFocus={(e) => {
                        editMode.current[`${row}-3`] = false;
                        setActiveRow(row);
                        setActiveCol(3);
                        e.target.select();
                      }}
                      onBlur={() => { editMode.current[`${row}-3`] = false; }}
                      onKeyDown={(e) => handleCellKeyDown(e, row, 3)}
                      className="w-full px-2 py-1.5 bg-transparent outline-none text-sm text-right"
                      disabled={!line.product_id}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {/* End-of-list hint */}
        {lines.length > 0 && !lines[lines.length - 1].product_id && (
          <div className="text-center py-1 text-[10px] text-muted-foreground border-t border-dashed border-neutral-200">
            Press <kbd className="border border-neutral-300 rounded px-1 py-0.5 text-[9px]">Enter</kbd> on blank line to finish items
          </div>
        )}
      </div>

      {/* Optional fields: Customer Name & Narration */}
      <div className="border-t border-neutral-200 px-4 py-1.5 flex items-start gap-6 text-xs bg-neutral-50/50">
        <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
          <input
            type="checkbox"
            checked={showCustomer}
            onChange={(e) => {
              setShowCustomer(e.target.checked);
              if (!e.target.checked) setCustomerName("");
            }}
            className="h-3.5 w-3.5 accent-primary"
          />
          <span className="text-muted-foreground">Customer</span>
        </label>
        {showCustomer && (
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer name"
            className="border border-neutral-300 px-2 py-1 bg-white outline-none font-mono w-48"
          />
        )}
        <label className="flex items-start gap-1.5 ml-auto">
          <span className="text-muted-foreground shrink-0 pt-1">Narration:</span>
          <textarea
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            placeholder="Optional notes…"
            rows={1}
            className="border border-neutral-300 px-2 py-1 bg-white outline-none font-mono w-56 resize-none text-xs"
          />
        </label>
      </div>

      {/* Footer: Discount, Payment, Save */}
      <div className="border-t border-neutral-300 bg-neutral-50">
        <div className="flex items-center justify-between px-4 py-2 gap-6 text-xs">
          {/* Left: footer fields */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <span className="text-muted-foreground">Discount:</span>
              <input
                ref={discountRef}
                type="number"
                value={discount || ""}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    paymentRef.current?.focus();
                  } else if ((e.key === "Enter" && e.shiftKey) || (e.key === "Backspace" && !discount)) {
                    e.preventDefault();
                    returnToGrid();
                  }
                }}
                className="w-24 border border-neutral-300 px-2 py-1 bg-white outline-none text-right font-mono"
                placeholder="0"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-muted-foreground">Payment:</span>
              <select
                ref={paymentRef}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    saveBtnRef.current?.focus();
                  } else if (e.key === "Enter" && e.shiftKey) {
                    e.preventDefault();
                    discountRef.current?.focus();
                  }
                }}
                className="border border-neutral-300 px-2 py-1 bg-white outline-none font-mono"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="transfer">Transfer</option>
              </select>
            </label>
            <button
              ref={saveBtnRef}
              onClick={saveVoucher}
              disabled={isProcessing || filledLines.length === 0}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveVoucher();
                } else if (e.key === "Backspace" || (e.key === "Enter" && e.shiftKey)) {
                  e.preventDefault();
                  paymentRef.current?.focus();
                }
              }}
              className="border border-neutral-300 px-3 py-1 bg-white hover:bg-neutral-100 font-medium disabled:opacity-40"
            >
              {isProcessing ? "Saving…" : "Save"}
              <span className="ml-1 text-[9px] border border-neutral-300 rounded px-1 py-0.5">F4</span>
            </button>
          </div>

          {/* Right: totals */}
          <div className="flex items-center gap-6">
            <div className="flex gap-2">
              <span className="text-muted-foreground">Items:</span>
              <span className="font-medium">{filledLines.reduce((s, l) => s + l.qty, 0)}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{subtotal.toLocaleString()} CFA</span>
            </div>
            {discount > 0 && (
              <div className="flex gap-2">
                <span className="text-muted-foreground">Discount:</span>
                <span className="font-medium text-destructive">-{discount.toLocaleString()} CFA</span>
              </div>
            )}
            <div className="flex gap-2 text-sm font-bold">
              <span>Grand Total:</span>
              <span>{grandTotal.toLocaleString()} CFA</span>
            </div>
            {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </div>
      </div>

      {/* Autocomplete dropdown - portaled to body */}
      {acOpen && activeCol === 0 && dropdownPos && createPortal(
        <div
          style={{
            position: "fixed",
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 9999,
            maxHeight: 250,
            overflowY: "auto" as const,
            background: "white",
            border: "1px solid #ccc",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {acResults.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">No products found. Try different search terms.</div>
          ) : (
            acResults.map((p, i) => {
              const s = acStockMap[p.id] ?? 0;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-2 py-1.5 cursor-pointer text-xs font-mono ${
                    i === acIndex ? "bg-blue-100" : "hover:bg-neutral-50"
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectProduct(p, activeRow);
                  }}
                  onMouseEnter={() => setAcIndex(i)}
                >
                  <div>
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground ml-2">{p.sku}</span>
                  </div>
                  <div>
                    <span>{Number(p.retail_price).toLocaleString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default POS;
