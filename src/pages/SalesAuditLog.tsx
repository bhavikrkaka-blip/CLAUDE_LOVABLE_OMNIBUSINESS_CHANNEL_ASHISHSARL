import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Eye, Calendar } from "lucide-react";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface AuditEntry {
  id: string;
  sale_id: string;
  action_type: string;
  previous_sale_snapshot: any;
  new_sale_snapshot: any;
  edited_by: string;
  edited_at: string;
  reason: string | null;
  invoice_number?: string;
  editor_email?: string;
  store_name?: string;
}

const SalesAuditLog = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Record<string, string>>({});
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  // Filters
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterStore, setFilterStore] = useState<string>("all");
  const [filterUser, setFilterUser] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: auditData }, { data: locData }] = await Promise.all([
      supabase
        .from("sales_audit_log")
        .select("*")
        .order("edited_at", { ascending: false })
        .limit(500),
      supabase.from("locations").select("id, name").eq("type", "store"),
    ]);

    const locMap: Record<string, string> = {};
    locData?.forEach((l) => (locMap[l.id] = l.name));
    setLocations(locMap);

    const enriched = (auditData ?? []).map((entry: any) => {
      const prevSale = entry.previous_sale_snapshot?.sale;
      const newSale = entry.new_sale_snapshot?.sale;
      const sale = prevSale || newSale;
      return {
        ...entry,
        invoice_number: sale?.invoice_number ?? "—",
        store_name: sale?.store_id ? locMap[sale.store_id] ?? "—" : "—",
      };
    });

    setEntries(enriched);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filterAction !== "all" && e.action_type !== filterAction) return false;
      if (filterStore !== "all" && !e.store_name?.includes(filterStore)) return false;
      if (filterUser && !e.edited_by?.toLowerCase().includes(filterUser.toLowerCase()) && !e.editor_email?.toLowerCase().includes(filterUser.toLowerCase())) return false;
      if (dateFrom) {
        const d = new Date(e.edited_at);
        if (d < dateFrom) return false;
      }
      if (dateTo) {
        const d = new Date(e.edited_at);
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      return true;
    });
  }, [entries, filterAction, filterStore, filterUser, dateFrom, dateTo]);

  const actionBadge = (type: string) => {
    if (type === "create") return <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">Create</Badge>;
    if (type === "edit") return <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">Edit</Badge>;
    if (type === "cancel") return <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10">Cancel</Badge>;
    return <Badge variant="outline">{type}</Badge>;
  };

  const storeNames = useMemo(() => Object.values(locations), [locations]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Sales Audit Log</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Date From */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("w-[140px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                <Calendar className="mr-1 h-3 w-3" />
                {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date To */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("w-[140px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                <Calendar className="mr-1 h-3 w-3" />
                {dateTo ? format(dateTo, "dd/MM/yyyy") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent mode="single" selected={dateTo} onSelect={setDateTo} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        {/* Action Type */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Action</label>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="edit">Edit</SelectItem>
              <SelectItem value="cancel">Cancel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Store */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Store</label>
          <Select value={filterStore} onValueChange={setFilterStore}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stores</SelectItem>
              {storeNames.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* User ID filter */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">User ID</label>
          <Input
            placeholder="Filter by user..."
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="w-[160px] h-9"
          />
        </div>

        {dateFrom || dateTo || filterAction !== "all" || filterStore !== "all" || filterUser ? (
          <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); setFilterAction("all"); setFilterStore("all"); setFilterUser(""); }}>
            Clear
          </Button>
        ) : null}
      </div>

      {/* Table */}
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Edited By</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No audit entries found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-xs">{entry.invoice_number}</TableCell>
                  <TableCell>{actionBadge(entry.action_type)}</TableCell>
                  <TableCell>{entry.store_name}</TableCell>
                  <TableCell className="font-mono text-xs max-w-[120px] truncate" title={entry.edited_by}>
                    {entry.edited_by?.slice(0, 8)}…
                  </TableCell>
                  <TableCell className="text-xs">
                    {format(new Date(entry.edited_at), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                    {entry.reason || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedEntry(entry)} title="View Details">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={(o) => !o && setSelectedEntry(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Detail — {selectedEntry?.invoice_number}</DialogTitle>
          </DialogHeader>
          {selectedEntry && <AuditDetailView entry={selectedEntry} locations={locations} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ---- Detail View with diff highlighting ----
function AuditDetailView({ entry, locations }: { entry: AuditEntry; locations: Record<string, string> }) {
  const prev = entry.previous_sale_snapshot;
  const next = entry.new_sale_snapshot;

  return (
    <div className="space-y-6 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <div><span className="text-muted-foreground">Action:</span> <span className="font-medium capitalize">{entry.action_type}</span></div>
        <div><span className="text-muted-foreground">Edited By:</span> <span className="font-mono text-xs">{entry.edited_by}</span></div>
        <div><span className="text-muted-foreground">Timestamp:</span> {format(new Date(entry.edited_at), "dd/MM/yyyy HH:mm:ss")}</div>
        {entry.reason && <div className="col-span-2"><span className="text-muted-foreground">Reason:</span> {entry.reason}</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Before */}
        <div className="space-y-2">
          <h3 className="font-semibold text-base">Before</h3>
          {prev ? (
            <SnapshotCard snapshot={prev} locations={locations} compareWith={next} side="before" />
          ) : (
            <div className="border rounded-md p-4 text-muted-foreground bg-muted/30">N/A (new sale)</div>
          )}
        </div>

        {/* After */}
        <div className="space-y-2">
          <h3 className="font-semibold text-base">After</h3>
          {next ? (
            <SnapshotCard snapshot={next} locations={locations} compareWith={prev} side="after" />
          ) : (
            <div className="border rounded-md p-4 text-muted-foreground bg-muted/30">N/A (cancelled)</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SnapshotCard({ snapshot, locations, compareWith, side }: { snapshot: any; locations: Record<string, string>; compareWith: any; side: "before" | "after" }) {
  const sale = snapshot?.sale;
  const items = snapshot?.items ?? [];
  const otherSale = compareWith?.sale;

  const isDiff = (field: string) => {
    if (!otherSale || !sale) return false;
    return JSON.stringify(sale[field]) !== JSON.stringify(otherSale[field]);
  };

  const diffClass = (field: string) =>
    isDiff(field) ? (side === "before" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800") : "";

  if (!sale) return <div className="border rounded-md p-4 text-muted-foreground bg-muted/30">No data</div>;

  return (
    <div className="border rounded-md p-3 space-y-3">
      <div className="grid grid-cols-2 gap-1 text-xs">
        <div className={cn("px-1 rounded", diffClass("invoice_number"))}>
          <span className="text-muted-foreground">Invoice:</span> {sale.invoice_number}
        </div>
        <div className={cn("px-1 rounded", diffClass("sale_date"))}>
          <span className="text-muted-foreground">Date:</span> {sale.sale_date}
        </div>
        <div className={cn("px-1 rounded", diffClass("store_id"))}>
          <span className="text-muted-foreground">Store:</span> {locations[sale.store_id] ?? sale.store_id}
        </div>
        <div className={cn("px-1 rounded", diffClass("payment_method"))}>
          <span className="text-muted-foreground">Payment:</span> {sale.payment_method}
        </div>
        <div className={cn("px-1 rounded", diffClass("total_amount"))}>
          <span className="text-muted-foreground">Total:</span> {Number(sale.total_amount).toLocaleString()} CFA
        </div>
        <div className={cn("px-1 rounded", diffClass("gross_profit"))}>
          <span className="text-muted-foreground">Profit:</span> {Number(sale.gross_profit).toLocaleString()} CFA
        </div>
        {sale.customer_name && (
          <div className={cn("col-span-2 px-1 rounded", diffClass("customer_name"))}>
            <span className="text-muted-foreground">Customer:</span> {sale.customer_name}
          </div>
        )}
      </div>

      {/* Items */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Product</TableHead>
            <TableHead className="text-xs text-right">Qty</TableHead>
            <TableHead className="text-xs text-right">Price</TableHead>
            <TableHead className="text-xs text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item: any, idx: number) => {
            const otherItems = compareWith?.items ?? [];
            const otherItem = otherItems.find((oi: any) => oi.product_id === item.product_id);
            const qtyDiff = otherItem && otherItem.quantity !== item.quantity;
            const priceDiff = otherItem && Number(otherItem.selling_price) !== Number(item.selling_price);
            const isNew = !otherItem;

            return (
              <TableRow key={idx} className={isNew ? (side === "after" ? "bg-green-50" : "bg-red-50") : ""}>
                <TableCell className="text-xs">{item.product_id?.slice(0, 8)}…</TableCell>
                <TableCell className={cn("text-xs text-right", qtyDiff && (side === "before" ? "text-red-700 font-bold" : "text-green-700 font-bold"))}>
                  {item.quantity}
                </TableCell>
                <TableCell className={cn("text-xs text-right", priceDiff && (side === "before" ? "text-red-700 font-bold" : "text-green-700 font-bold"))}>
                  {Number(item.selling_price).toLocaleString()}
                </TableCell>
                <TableCell className="text-xs text-right">
                  {(item.quantity * Number(item.selling_price)).toLocaleString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default SalesAuditLog;
