import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  ArrowLeftRight,
  History,
  SlidersHorizontal,
  Package,
  Loader2,
  ArrowLeft,
  Camera,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PrintLabelDialog from "@/components/admin/PrintLabelDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductImportHub from "@/components/admin/ProductImportHub";

interface Location {
  id: string;
  name: string;
  type: string;
}

interface InventoryRow {
  product_id: string;
  product_name: string;
  sku: string;
  barcode: string | null;
  quantity: number;           // total (sum across locations if all-mode)
  reorder_level: number;
  cost_price: number;
  wholesale_price: number;
  retail_price: number;
  location_id?: string;       // undefined when in all-locations mode
  location_name?: string;     // undefined when in all-locations mode
  locationBreakdown?: { name: string; qty: number }[]; // only in all-locations mode
}

interface StockMovement {
  id: string;
  movement_type: string;
  quantity: number;
  reference_id: string | null;
  from_location_id: string | null;
  to_location_id: string | null;
  created_at: string;
  is_negative_warning: boolean;
}


interface AiSearchResult {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  retail_price: number;
  score: number;
  image_url?: string | null;
}

const AdminInventory = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [inventoryData, setInventoryData] = useState<InventoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Movement history modal
  const [historyProduct, setHistoryProduct] = useState<InventoryRow | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);

  // Transfer modal
  const [transferProduct, setTransferProduct] = useState<InventoryRow | null>(null);
  const [transferToLocationId, setTransferToLocationId] = useState("");
  const [transferQty, setTransferQty] = useState(1);
  const [isTransferring, setIsTransferring] = useState(false);

  // Adjust modal
  const [adjustProduct, setAdjustProduct] = useState<InventoryRow | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReference, setAdjustReference] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  /* AI / Image search */
  const [aiQuery, setAiQuery] = useState("");
  const [aiResults, setAiResults] = useState<AiSearchResult[] | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchMode, setAiSearchMode] = useState<"text" | "image" | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageSearchRef = useRef<HTMLInputElement>(null);

  // Load locations
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("locations").select("id, name, type");
      if (data && data.length > 0) {
        setLocations(data);
        // Default to first warehouse
        const warehouse = data.find((l) => l.type === "warehouse") || data[0];
        setSelectedLocationId(warehouse.id);
      }
    };
    fetch();
  }, []);

  // Load inventory for selected location
  const loadInventory = useCallback(async () => {
    if (!selectedLocationId) return;
    setIsLoading(true);

    if (selectedLocationId === "all") {
      // Fetch ALL inventory rows across all locations, join with locations + products
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          product_id,
          quantity,
          location_id,
          locations!inner ( name ),
          products!inner (
            name,
            sku,
            barcode,
            reorder_level,
            cost_price,
            wholesale_price,
            retail_price,
            is_active
          )
        `)
        .eq("products.is_active", true);

      if (error) {
        console.error("Inventory fetch error:", error);
        setInventoryData([]);
      } else if (data) {
        // Group by product_id
        const productMap = new Map<string, InventoryRow>();
        for (const row of data as any[]) {
          const pid = row.product_id;
          const locName = row.locations?.name ?? row.location_id;
          const qty = row.quantity ?? 0;
          if (!productMap.has(pid)) {
            productMap.set(pid, {
              product_id: pid,
              product_name: row.products.name,
              sku: row.products.sku,
              barcode: row.products.barcode,
              quantity: 0,
              reorder_level: row.products.reorder_level ?? 0,
              cost_price: Number(row.products.cost_price ?? 0),
              wholesale_price: Number(row.products.wholesale_price ?? 0),
              retail_price: Number(row.products.retail_price ?? 0),
              locationBreakdown: [],
            });
          }
          const entry = productMap.get(pid);
          entry.quantity += qty;
          entry.locationBreakdown.push({ name: locName, qty });
        }
        setInventoryData(Array.from(productMap.values()));
      }
    } else {
      // Original single-location query
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          product_id,
          quantity,
          products!inner (
            name,
            sku,
            barcode,
            reorder_level,
            cost_price,
            wholesale_price,
            retail_price,
            is_active
          )
        `)
        .eq("location_id", selectedLocationId)
        .eq("products.is_active", true);

      if (error) {
        console.error("Inventory fetch error:", error);
        setInventoryData([]);
      } else if (data) {
        const rows: InventoryRow[] = (data as any[]).map((row) => ({
          product_id: row.product_id,
          product_name: row.products.name,
          sku: row.products.sku,
          barcode: row.products.barcode,
          quantity: row.quantity,
          reorder_level: row.products.reorder_level ?? 0,
          cost_price: Number(row.products.cost_price ?? 0),
          wholesale_price: Number(row.products.wholesale_price ?? 0),
          retail_price: Number(row.products.retail_price ?? 0),
        }));
        setInventoryData(rows);
      }
    }
    setIsLoading(false);
  }, [selectedLocationId]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Filtered & searched data
  const filteredData = useMemo(() => {
    let result = inventoryData;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.product_name.toLowerCase().includes(q) ||
          r.sku.toLowerCase().includes(q) ||
          (r.barcode && r.barcode.toLowerCase().includes(q))
      );
    }

    if (lowStockOnly) {
      result = result.filter((r) => r.quantity <= r.reorder_level);
    }

    return result;
  }, [inventoryData, searchQuery, lowStockOnly]);

  // Status color
  const getStatusColor = (qty: number, reorderLevel: number) => {
    if (qty === 0) return "bg-red-500";
    if (qty <= reorderLevel) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getMargin = (cost: number, retail: number) => {
    if (cost === 0) return null;
    return ((retail - cost) / cost) * 100;
  };

  const getMarginColor = (margin: number | null) => {
    if (margin === null) return "";
    if (margin < 10) return "text-red-600";
    if (margin <= 20) return "text-yellow-600";
    return "text-green-600";
  };

  // View movement history
  const openHistory = async (product: InventoryRow) => {
    setHistoryProduct(product);
    setIsLoadingMovements(true);
    const { data } = await supabase
      .from("stock_movements")
      .select("*")
      .eq("product_id", product.product_id)
      .or(`from_location_id.eq.${selectedLocationId},to_location_id.eq.${selectedLocationId}`)
      .order("created_at", { ascending: false })
      .limit(50);
    setMovements(data ?? []);
    setIsLoadingMovements(false);
  };

  // Transfer stock
  const handleTransfer = async () => {
    if (!transferProduct || !transferToLocationId || transferQty < 1) return;
    setIsTransferring(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-stock-audit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            location_id: selectedLocationId,
            reference: `TRANSFER-${Date.now()}`,
            items: [
              {
                product_id: transferProduct.product_id,
                physical_quantity: transferProduct.quantity - transferQty,
              },
            ],
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Transfer failed");
      }

      // Add stock to destination
      const res2 = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-stock-audit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            location_id: transferToLocationId,
            reference: `TRANSFER-IN-${Date.now()}`,
            items: [
              {
                product_id: transferProduct.product_id,
                physical_quantity:
                  (await getStockAtLocation(transferProduct.product_id, transferToLocationId)) +
                  transferQty,
              },
            ],
          }),
        }
      );

      if (!res2.ok) {
        const err = await res2.json();
        throw new Error(err.error || "Transfer destination failed");
      }

      toast({ title: "Transfer complete", description: `${transferQty} units moved.` });
      setTransferProduct(null);
      loadInventory();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsTransferring(false);
    }
  };

  const getStockAtLocation = async (productId: string, locationId: string) => {
    const { data } = await supabase
      .from("inventory")
      .select("quantity")
      .eq("product_id", productId)
      .eq("location_id", locationId)
      .maybeSingle();
    return data?.quantity ?? 0;
  };

  // Adjust stock
  const handleAdjust = async () => {
    if (!adjustProduct) return;
    setIsAdjusting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-stock-audit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            location_id: selectedLocationId,
            reference: adjustReference || `ADJ-${Date.now()}`,
            items: [
              {
                product_id: adjustProduct.product_id,
                physical_quantity: adjustQty,
              },
            ],
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Adjustment failed");
      }

      toast({ title: "Stock adjusted", description: `New quantity: ${adjustQty}` });
      setAdjustProduct(null);
      loadInventory();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsAdjusting(false);
    }
  };


  /* ── AI / Image search helpers ── */
  const runAiSearch = async (queryText: string): Promise<AiSearchResult[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
        },
        body: JSON.stringify({ query_text: queryText }),
      }
    );
    if (!res.ok) throw new Error("Search failed");
    const raw = (await res.json()).results as AiSearchResult[];
    // Only show relevant results (>= 25% match), top 8
    return raw.filter((r) => r.score >= 0.25).slice(0, 8);
  };

  const handleAiTextSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsAiSearching(true);
    setAiResults(null);
    setAiSearchMode("text");
    try {
      const hits = await runAiSearch(searchQuery.trim());
      // Enrich with image_url from products table
      if (hits.length > 0) {
        const ids = hits.map((h) => h.id);
        const { data } = await supabase.from("products").select("id, image_url").in("id", ids);
        const imgMap: Record<string, string | null> = {};
        (data ?? []).forEach((p: any) => { imgMap[p.id] = p.image_url ?? null; });
        setAiResults(hits.map((h) => ({ ...h, image_url: imgMap[h.id] ?? null })));
      } else {
        setAiResults([]);
      }
    } catch (e: any) {
      toast({ title: "AI search failed", description: e.message, variant: "destructive" });
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleImageFileSearch = async (file: File) => {
    setIsAiSearching(true);
    setAiResults(null);
    setAiSearchMode("image");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const preview = ev.target?.result as string;
      setImagePreview(preview);
      try {
        const LOVABLE_API_KEY = import.meta.env.VITE_LOVABLE_API_KEY;
        let description = file.name.replace(/.[^.]+$/, "").replace(/[-_]/g, " ");
        if (LOVABLE_API_KEY) {
          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [{
                role: "user",
                content: [
                  { type: "text", text: "Describe this product concisely for a product search query. Include the product type, color, material, brand if visible, and key features. Return only the search query, no extra text." },
                  { type: "image_url", image_url: { url: preview } },
                ],
              }],
            }),
          });
          if (aiRes.ok) {
            const aiData = await aiRes.json();
            description = aiData.choices?.[0]?.message?.content ?? description;
          }
        }
        const hits = await runAiSearch(description);
        if (hits.length > 0) {
          const ids = hits.map((h) => h.id);
          const { data } = await supabase.from("products").select("id, image_url").in("id", ids);
          const imgMap: Record<string, string | null> = {};
          (data ?? []).forEach((p: any) => { imgMap[p.id] = p.image_url ?? null; });
          setAiResults(hits.map((h) => ({ ...h, image_url: imgMap[h.id] ?? null })));
        } else {
          setAiResults([]);
        }
      } catch (e: any) {
        toast({ title: "Image search failed", description: e.message, variant: "destructive" });
      } finally {
        setIsAiSearching(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearAiSearch = () => {
    setAiResults(null);
    setAiSearchMode(null);
    setImagePreview(null);
  };

  const selectedLocationName =
    selectedLocationId === "all"
      ? "All Locations"
      : locations.find((l) => l.id === selectedLocationId)?.name ?? "";

  return (
    <div className="space-y-0">
      <Tabs defaultValue="stock" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="stock">Stock Overview</TabsTrigger>
            <TabsTrigger value="import">Import & Images</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="stock" className="mt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Inventory Management
        </h1>
        <div className="flex items-center gap-2">
          <Switch
            id="low-stock"
            checked={lowStockOnly}
            onCheckedChange={setLowStockOnly}
          />
          <Label htmlFor="low-stock" className="text-sm text-muted-foreground">
            Low stock only
          </Label>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-b border-border space-y-2">
        <div className="flex items-center gap-3">
          <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name} ({loc.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Unified search bar */}
          <div className="relative flex-1 max-w-lg flex items-center gap-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU, barcode — or press ↵ for AI semantic search"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if (aiResults) clearAiSearch(); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleAiTextSearch(); }}
                className="pl-10 pr-4"
              />
            </div>
            {/* AI Text Search button */}
            <Button
              variant="outline"
              size="icon"
              title="AI Semantic Search (Enter)"
              onClick={handleAiTextSearch}
              disabled={isAiSearching || !searchQuery.trim()}
              className="shrink-0"
            >
              {isAiSearching && aiSearchMode === "text" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
            {/* Image Search button */}
            <Button
              variant="outline"
              size="icon"
              title="Search by photo"
              onClick={() => imageSearchRef.current?.click()}
              disabled={isAiSearching}
              className="shrink-0"
            >
              {isAiSearching && aiSearchMode === "image" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
            <input
              ref={imageSearchRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageFileSearch(file);
                e.target.value = "";
              }}
            />
          </div>

          <div className="text-sm text-muted-foreground shrink-0">
            {aiResults !== null ? `${aiResults.length} AI result${aiResults.length !== 1 ? "s" : ""}` : `${filteredData.length} product${filteredData.length !== 1 ? "s" : ""}`}
          </div>
        </div>

        {/* AI Search Results Panel */}
        {(isAiSearching || aiResults !== null) && (
          <div className="mt-1 border rounded-lg bg-muted/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                {aiSearchMode === "image" && imagePreview && (
                  <img src={imagePreview} alt="query" className="h-8 w-8 object-cover rounded border" />
                )}
                <Sparkles className="h-3.5 w-3.5" />
                {isAiSearching ? "Searching…" : `${aiResults?.length ?? 0} closest match${(aiResults?.length ?? 0) !== 1 ? "es" : ""} found`}
              </div>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearAiSearch}>
                ✕ Clear
              </Button>
            </div>

            {isAiSearching ? (
              <div className="flex gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 w-28 rounded bg-muted animate-pulse" />
                ))}
              </div>
            ) : aiResults && aiResults.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No matching products found. Try a different query.</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {aiResults?.map((r) => (
                  <div key={r.id} className="shrink-0 w-32 border rounded bg-background p-2 text-xs">
                    <div className="h-20 w-full bg-muted rounded mb-2 flex items-center justify-center overflow-hidden">
                      {r.image_url ? (
                        <img src={r.image_url} alt={r.name} className="h-full w-full object-contain" />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground/40" />
                      )}
                    </div>
                    <p className="font-medium leading-tight line-clamp-2">{r.name}</p>
                    <p className="text-muted-foreground text-[10px]">{r.brand}</p>
                    <p className="font-bold mt-1">{Number(r.retail_price).toLocaleString()} FCFA</p>
                    <p className="text-[10px] text-primary font-medium">{Math.round(r.score * 100)}% match</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 130px)" }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No inventory data found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                {selectedLocationId === "all" && <TableHead>Locations</TableHead>}
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Reorder</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Wholesale</TableHead>
                <TableHead className="text-right">Retail</TableHead>
                <TableHead className="text-right">Margin %</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row) => (
                <TableRow key={row.product_id}>
                  <TableCell>
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${getStatusColor(
                        row.quantity,
                        row.reorder_level
                      )}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{row.product_name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {row.sku}
                  </TableCell>
                  {selectedLocationId === "all" && (
                    <TableCell className="text-xs text-muted-foreground max-w-[220px]">
                      {row.locationBreakdown && row.locationBreakdown.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {row.locationBreakdown.map((lb) => (
                            <span key={lb.name} className="inline-flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium">
                              {lb.name}: <span className={lb.qty === 0 ? "text-red-500" : "text-foreground"}>{lb.qty}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-center font-semibold">{row.quantity}</TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {row.reorder_level}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {row.cost_price.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {row.wholesale_price.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.retail_price.toLocaleString()}
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${getMarginColor(getMargin(row.cost_price, row.retail_price))}`}>
                    {getMargin(row.cost_price, row.retail_price) !== null
                      ? `${getMargin(row.cost_price, row.retail_price)!.toFixed(1)}%`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => openHistory(row)}
                      >
                        <History className="h-3 w-3 mr-1" />
                        History
                      </Button>
                      <PrintLabelDialog
                        product={{
                          id: row.product_id,
                          name: row.product_name,
                          sku: row.sku,
                          barcode: row.barcode,
                          retail_price: row.retail_price,
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        disabled={selectedLocationId === "all"}
                        title={selectedLocationId === "all" ? "Select a specific location to transfer stock" : undefined}
                        onClick={() => {
                          setTransferProduct(row);
                          setTransferQty(1);
                          setTransferToLocationId("");
                        }}
                      >
                        <ArrowLeftRight className="h-3 w-3 mr-1" />
                        Transfer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        disabled={selectedLocationId === "all"}
                        title={selectedLocationId === "all" ? "Select a specific location to adjust stock" : undefined}
                        onClick={() => {
                          setAdjustProduct(row);
                          setAdjustQty(row.quantity);
                          setAdjustReference("");
                        }}
                      >
                        <SlidersHorizontal className="h-3 w-3 mr-1" />
                        Adjust
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Movement History Modal */}
      <Dialog open={!!historyProduct} onOpenChange={() => setHistoryProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Movement History — {historyProduct?.product_name}
            </DialogTitle>
          </DialogHeader>
          {isLoadingMovements ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : movements.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No movements found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString()}{" "}
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          m.movement_type === "purchase"
                            ? "bg-green-100 text-green-800"
                            : m.movement_type === "sale"
                            ? "bg-blue-100 text-blue-800"
                            : m.movement_type === "adjustment"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {m.movement_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {m.reference_id || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Modal */}
      <Dialog open={!!transferProduct} onOpenChange={() => setTransferProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer — {transferProduct?.product_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">From</Label>
              <p className="text-sm font-medium">{selectedLocationName} (current: {transferProduct?.quantity})</p>
            </div>
            <div>
              <Label className="text-sm">To</Label>
              <Select value={transferToLocationId} onValueChange={setTransferToLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {locations
                    .filter((l) => l.id !== selectedLocationId)
                    .map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name} ({l.type})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Quantity</Label>
              <Input
                type="number"
                min={1}
                max={transferProduct?.quantity ?? 1}
                value={transferQty}
                onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
              />
              {transferProduct && transferQty > transferProduct.quantity && (
                <p className="text-destructive text-xs mt-1">Exceeds available stock</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferProduct(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={
                isTransferring ||
                !transferToLocationId ||
                transferQty < 1 ||
                (transferProduct ? transferQty > transferProduct.quantity : true)
              }
            >
              {isTransferring && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Modal */}
      <Dialog open={!!adjustProduct} onOpenChange={() => setAdjustProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock — {adjustProduct?.product_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Current Stock</Label>
              <p className="text-sm font-semibold">{adjustProduct?.quantity}</p>
            </div>
            <div>
              <Label className="text-sm">New Physical Quantity</Label>
              <Input
                type="number"
                min={0}
                value={adjustQty}
                onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label className="text-sm">Reference (optional)</Label>
              <Input
                placeholder="e.g. COUNT-2026-02"
                value={adjustReference}
                onChange={(e) => setAdjustReference(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustProduct(null)}>
              Cancel
            </Button>
            <Button onClick={handleAdjust} disabled={isAdjusting}>
              {isAdjusting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="import" className="mt-0">
          <ProductImportHub />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminInventory;
