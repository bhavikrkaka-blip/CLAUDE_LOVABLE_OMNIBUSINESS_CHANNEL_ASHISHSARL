import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, UserCheck, User } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useEffect } from "react";

interface CustomerResult {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  total_orders: number;
  total_spent: number;
}

interface CustomerLookupProps {
  onSelect: (customer: CustomerResult) => void;
}

const fmtCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";

const CustomerLookup = ({ onSelect }: CustomerLookupProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      // Search in profiles (customers) and their order history
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone, email, city")
        .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(10);

      // Also try direct user email search via auth.users — use orders table phone instead
      const { data: byPhone } = await supabase
        .from("orders")
        .select("user_id, shipping_phone, shipping_city")
        .ilike("shipping_phone", `%${q}%`)
        .not("user_id", "is", null)
        .limit(10);

      const allUserIds = new Set([
        ...(profiles?.map(p => p.id) ?? []),
        ...(byPhone?.map(o => o.user_id).filter(Boolean) ?? []),
      ]);

      const customerList: CustomerResult[] = [];
      for (const userId of allUserIds) {
        const profile = profiles?.find(p => p.id === userId);

        // Get order stats
        const { data: orders } = await supabase
          .from("orders")
          .select("total_amount, shipping_phone, shipping_city")
          .eq("user_id", userId)
          .eq("status", "delivered");

        const total_orders = orders?.length ?? 0;
        const total_spent = orders?.reduce((s, o) => s + Number(o.total_amount), 0) ?? 0;
        const phone = profile?.phone ?? orders?.[0]?.shipping_phone ?? null;
        const city = profile?.city ?? orders?.[0]?.shipping_city ?? null;

        customerList.push({
          id: userId,
          full_name: profile?.full_name ?? null,
          phone,
          email: profile?.email ?? null,
          city,
          total_orders,
          total_spent,
        });
      }
      setResults(customerList);
    } catch (err) {
      console.error("Customer search error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  const handleSelect = (c: CustomerResult) => {
    onSelect(c);
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" type="button">
          <UserCheck className="h-4 w-4 mr-1" />
          Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customer Lookup</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {results.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Total Spent</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{c.full_name ?? "Guest"}</p>
                            {c.city && <p className="text-xs text-muted-foreground">{c.city}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{c.phone ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{c.total_orders}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">{fmtCFA(c.total_spent)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="default" onClick={() => handleSelect(c)}>
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No customers found for "{query}"</p>
              <p className="text-xs mt-1">Only searched among registered customers</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerLookup;
