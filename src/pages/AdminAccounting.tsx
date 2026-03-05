import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, BookOpen, BarChart3, Calculator, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parent_id: string | null;
  description: string | null;
  is_active: boolean;
}

interface JournalLine {
  account_id: string;
  debit: number;
  credit: number;
  description: string;
}

interface TrialBalanceRow {
  account_id: string;
  code: string;
  name: string;
  type: AccountType;
  total_debit: number;
  total_credit: number;
  balance: number;
}

const fmtCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(Math.abs(n)));
const typeColor: Record<AccountType, string> = {
  asset: "bg-blue-100 text-blue-800",
  liability: "bg-red-100 text-red-800",
  equity: "bg-purple-100 text-purple-800",
  revenue: "bg-green-100 text-green-800",
  expense: "bg-orange-100 text-orange-800",
};

const AdminAccounting = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("chart");

  // Chart of accounts form
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<AccountType>("asset");
  const [newDesc, setNewDesc] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);

  // Journal entry form
  const [journalDate, setJournalDate] = useState(new Date().toISOString().slice(0, 10));
  const [journalRef, setJournalRef] = useState("");
  const [journalDesc, setJournalDesc] = useState("");
  const [journalLines, setJournalLines] = useState<JournalLine[]>([
    { account_id: "", debit: 0, credit: 0, description: "" },
    { account_id: "", debit: 0, credit: 0, description: "" },
  ]);
  const [savingJournal, setSavingJournal] = useState(false);

  // Trial balance
  const [trialBalance, setTrialBalance] = useState<TrialBalanceRow[]>([]);
  const [tbLoading, setTbLoading] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("code");
    if (!error) setAccounts(data as Account[]);
    setLoading(false);
  };

  const saveAccount = async () => {
    if (!newCode.trim() || !newName.trim()) {
      toast.error("Code and name are required");
      return;
    }
    setSavingAccount(true);
    const { error } = await supabase.from("accounts").insert({
      code: newCode.trim(),
      name: newName.trim(),
      type: newType,
      description: newDesc || null,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created");
      setNewCode(""); setNewName(""); setNewDesc("");
      await loadAccounts();
    }
    setSavingAccount(false);
  };

  const deleteAccount = async (id: string) => {
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Account deleted"); loadAccounts(); }
  };

  // Journal line helpers
  const updateLine = (i: number, field: keyof JournalLine, val: string | number) => {
    setJournalLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  };
  const addLine = () => setJournalLines(prev => [...prev, { account_id: "", debit: 0, credit: 0, description: "" }]);
  const removeLine = (i: number) => setJournalLines(prev => prev.filter((_, idx) => idx !== i));

  const totalDebit = journalLines.reduce((s, l) => s + Number(l.debit), 0);
  const totalCredit = journalLines.reduce((s, l) => s + Number(l.credit), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const saveJournalEntry = async () => {
    if (!journalDesc.trim()) { toast.error("Description is required"); return; }
    const validLines = journalLines.filter(l => l.account_id && (Number(l.debit) > 0 || Number(l.credit) > 0));
    if (validLines.length < 2) { toast.error("At least 2 lines required"); return; }
    if (!isBalanced) { toast.error("Debits must equal credits"); return; }

    setSavingJournal(true);
    try {
      const { data: entry, error: entryError } = await supabase
        .from("journal_entries")
        .insert({
          date: journalDate,
          reference: journalRef || null,
          description: journalDesc,
        })
        .select()
        .single();
      if (entryError) throw entryError;
      if (!entry) throw new Error("Journal entry was not created");

      const lines = validLines.map(l => ({
        entry_id: entry.id,
        account_id: l.account_id,
        debit: Number(l.debit),
        credit: Number(l.credit),
        description: l.description || null,
      }));
      const { error: linesError } = await supabase.from("journal_lines").insert(lines);
      if (linesError) throw linesError;

      toast.success("Journal entry saved");
      setJournalDesc(""); setJournalRef("");
      setJournalLines([
        { account_id: "", debit: 0, credit: 0, description: "" },
        { account_id: "", debit: 0, credit: 0, description: "" },
      ]);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSavingJournal(false);
    }
  };

  const loadTrialBalance = async () => {
    setTbLoading(true);
    try {
      // Fetch all journal lines with account info
      const { data: lines } = await supabase
        .from("journal_lines")
        .select("account_id, debit, credit, accounts(code, name, type)");

      const map = new Map<string, TrialBalanceRow>();
      // Init from all accounts
      accounts.forEach(a => {
        map.set(a.id, { account_id: a.id, code: a.code, name: a.name, type: a.type, total_debit: 0, total_credit: 0, balance: 0 });
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lines?.forEach((l: any) => {
        const row = map.get(l.account_id);
        if (row) {
          row.total_debit += Number(l.debit);
          row.total_credit += Number(l.credit);
        }
      });

      const result = Array.from(map.values()).map(r => ({
        ...r,
        balance: r.total_debit - r.total_credit,
      })).sort((a, b) => a.code.localeCompare(b.code));

      setTrialBalance(result);
    } catch (err) {
      toast.error("Failed to load trial balance: " + (err as Error).message);
    } finally {
      setTbLoading(false);
    }
  };

  // P&L / Balance Sheet derived from trial balance
  const revenue = trialBalance.filter(r => r.type === "revenue");
  const expenses = trialBalance.filter(r => r.type === "expense");
  const assets = trialBalance.filter(r => r.type === "asset");
  const liabilities = trialBalance.filter(r => r.type === "liability");
  const equity = trialBalance.filter(r => r.type === "equity");

  const totalRevenue = revenue.reduce((s, r) => s + r.total_credit - r.total_debit, 0);
  const totalExpenses = expenses.reduce((s, r) => s + r.total_debit - r.total_credit, 0);
  const netIncome = totalRevenue - totalExpenses;
  const totalAssets = assets.reduce((s, r) => s + r.total_debit - r.total_credit, 0);
  const totalLiabilities = liabilities.reduce((s, r) => s + r.total_credit - r.total_debit, 0);
  const totalEquity = equity.reduce((s, r) => s + r.total_credit - r.total_debit, 0) + netIncome;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <BookOpen className="h-5 w-5" /> Accounting Module
      </h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="chart" className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" /> Chart of Accounts
          </TabsTrigger>
          <TabsTrigger value="journal" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> Journal Entry
          </TabsTrigger>
          <TabsTrigger value="trial" className="flex items-center gap-1.5" onClick={loadTrialBalance}>
            <Calculator className="h-4 w-4" /> Trial Balance
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-1.5" onClick={loadTrialBalance}>
            <BarChart3 className="h-4 w-4" /> P&L / Balance Sheet
          </TabsTrigger>
        </TabsList>

        {/* Chart of Accounts */}
        <TabsContent value="chart" className="space-y-4">
          {/* Add Account Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add Account</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label>Code</Label>
                  <Input placeholder="e.g. 5200" value={newCode} onChange={e => setNewCode(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input placeholder="Account name" value={newName} onChange={e => setNewName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select value={newType} onValueChange={v => setNewType(v as AccountType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["asset", "liability", "equity", "revenue", "expense"] as AccountType[]).map(t => (
                        <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Description (optional)</Label>
                  <Input placeholder="Notes..." value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                </div>
              </div>
              <Button className="mt-3" onClick={saveAccount} disabled={savingAccount}>
                {savingAccount ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Add Account
              </Button>
            </CardContent>
          </Card>

          {/* Accounts Table */}
          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accounts.map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="font-mono font-semibold">{a.code}</TableCell>
                          <TableCell className="font-medium">{a.name}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColor[a.type]}`}>
                              {a.type}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{a.description ?? "—"}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => deleteAccount(a.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journal Entry */}
        <TabsContent value="journal" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">New Journal Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Header fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Date</Label>
                  <Input type="date" value={journalDate} onChange={e => setJournalDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Reference</Label>
                  <Input placeholder="Inv #, PO #, etc." value={journalRef} onChange={e => setJournalRef(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Description *</Label>
                  <Input placeholder="Describe this entry" value={journalDesc} onChange={e => setJournalDesc(e.target.value)} />
                </div>
              </div>

              <Separator />

              {/* Lines */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-1">
                  <div className="col-span-4">Account</div>
                  <div className="col-span-3">Description</div>
                  <div className="col-span-2 text-right">Debit (FCFA)</div>
                  <div className="col-span-2 text-right">Credit (FCFA)</div>
                  <div className="col-span-1"></div>
                </div>
                {journalLines.map((line, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <Select value={line.account_id} onValueChange={v => updateLine(i, "account_id", v)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select account..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {accounts.map(a => (
                            <SelectItem key={a.id} value={a.id} className="text-xs">
                              {a.code} — {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input className="h-8 text-xs" placeholder="Description" value={line.description} onChange={e => updateLine(i, "description", e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <Input className="h-8 text-xs text-right" type="number" min="0" value={line.debit || ""} onChange={e => updateLine(i, "debit", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="col-span-2">
                      <Input className="h-8 text-xs text-right" type="number" min="0" value={line.credit || ""} onChange={e => updateLine(i, "credit", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {journalLines.length > 2 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeLine(i)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4 mr-1" /> Add Line
              </Button>

              {/* Totals */}
              <div className="border rounded-lg p-3 bg-muted/30">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">Total Debit</p>
                    <p className="font-bold">{fmtCFA(totalDebit)} FCFA</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">Total Credit</p>
                    <p className="font-bold">{fmtCFA(totalCredit)} FCFA</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">Difference</p>
                    <p className={`font-bold ${isBalanced ? "text-green-600" : "text-red-600"}`}>
                      {isBalanced ? "Balanced" : fmtCFA(Math.abs(totalDebit - totalCredit)) + " FCFA"}
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={saveJournalEntry} disabled={savingJournal || !isBalanced} className="w-full">
                {savingJournal ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Save Journal Entry
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trial Balance */}
        <TabsContent value="trial" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Trial Balance</h2>
            <Button variant="outline" size="sm" onClick={loadTrialBalance} disabled={tbLoading}>
              {tbLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Refresh
            </Button>
          </div>
          <Card>
            <CardContent className="pt-4">
              {tbLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Account Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trialBalance.map(r => (
                        <TableRow key={r.account_id}>
                          <TableCell className="font-mono text-xs">{r.code}</TableCell>
                          <TableCell className="font-medium text-sm">{r.name}</TableCell>
                          <TableCell>
                            <span className={`px-1.5 py-0.5 rounded text-xs ${typeColor[r.type]}`}>{r.type}</span>
                          </TableCell>
                          <TableCell className="text-right text-sm">{r.total_debit > 0 ? fmtCFA(r.total_debit) : "—"}</TableCell>
                          <TableCell className="text-right text-sm">{r.total_credit > 0 ? fmtCFA(r.total_credit) : "—"}</TableCell>
                          <TableCell className={`text-right font-medium text-sm ${r.balance < 0 ? "text-red-600" : ""}`}>
                            {r.balance !== 0 ? (r.balance < 0 ? "-" : "") + fmtCFA(r.balance) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Totals row */}
                      <TableRow className="border-t-2 font-bold bg-muted/30">
                        <TableCell colSpan={3}>TOTALS</TableCell>
                        <TableCell className="text-right">{fmtCFA(trialBalance.reduce((s, r) => s + r.total_debit, 0))}</TableCell>
                        <TableCell className="text-right">{fmtCFA(trialBalance.reduce((s, r) => s + r.total_credit, 0))}</TableCell>
                        <TableCell className="text-right">—</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* P&L / Balance Sheet */}
        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Financial Reports</h2>
            <Button variant="outline" size="sm" onClick={loadTrialBalance} disabled={tbLoading}>
              {tbLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* P&L */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Profit &amp; Loss Statement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Revenue</p>
                  {revenue.length === 0 ? <p className="text-xs text-muted-foreground">No revenue entries</p> : revenue.map(r => (
                    <div key={r.account_id} className="flex justify-between text-sm py-1">
                      <span>{r.code} — {r.name}</span>
                      <span className="font-medium text-green-600">{fmtCFA(r.total_credit - r.total_debit)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold text-sm border-t pt-2 mt-1">
                    <span>Total Revenue</span>
                    <span className="text-green-600">{fmtCFA(totalRevenue)}</span>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Expenses</p>
                  {expenses.length === 0 ? <p className="text-xs text-muted-foreground">No expense entries</p> : expenses.map(r => (
                    <div key={r.account_id} className="flex justify-between text-sm py-1">
                      <span>{r.code} — {r.name}</span>
                      <span className="font-medium text-orange-600">{fmtCFA(r.total_debit - r.total_credit)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold text-sm border-t pt-2 mt-1">
                    <span>Total Expenses</span>
                    <span className="text-orange-600">{fmtCFA(totalExpenses)}</span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold pt-1">
                  <span>Net Income</span>
                  <span className={netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                    {netIncome < 0 ? "(" : ""}{fmtCFA(netIncome)} FCFA{netIncome < 0 ? ")" : ""}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Balance Sheet */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Balance Sheet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Assets</p>
                  {assets.map(r => (
                    <div key={r.account_id} className="flex justify-between text-sm py-1">
                      <span>{r.code} — {r.name}</span>
                      <span className="font-medium">{fmtCFA(r.total_debit - r.total_credit)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold text-sm border-t pt-2 mt-1">
                    <span>Total Assets</span>
                    <span className="text-blue-600">{fmtCFA(totalAssets)}</span>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Liabilities</p>
                  {liabilities.map(r => (
                    <div key={r.account_id} className="flex justify-between text-sm py-1">
                      <span>{r.code} — {r.name}</span>
                      <span className="font-medium">{fmtCFA(r.total_credit - r.total_debit)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold text-sm border-t pt-2 mt-1">
                    <span>Total Liabilities</span>
                    <span className="text-red-600">{fmtCFA(totalLiabilities)}</span>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">Equity</p>
                  {equity.map(r => (
                    <div key={r.account_id} className="flex justify-between text-sm py-1">
                      <span>{r.code} — {r.name}</span>
                      <span className="font-medium">{fmtCFA(r.total_credit - r.total_debit)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-muted-foreground">+ Net Income</span>
                    <span className={netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                      {netIncome < 0 ? "-" : "+"}{fmtCFA(netIncome)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-sm border-t pt-2 mt-1">
                    <span>Total Equity</span>
                    <span className="text-purple-600">{fmtCFA(totalEquity)}</span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Liabilities + Equity</span>
                  <span className={Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1 ? "text-green-600" : "text-red-600"}>
                    {fmtCFA(totalLiabilities + totalEquity)}
                  </span>
                </div>
                {Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1 && (
                  <p className="text-xs text-green-600 text-center">Balance sheet is balanced</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAccounting;
