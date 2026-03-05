/**
 * DeliveryZoneManager — Admin UI for managing delivery zones and fees.
 * Zones define per-city or fallback shipping costs shown at checkout.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MapPin, Loader2 } from "lucide-react";

interface DeliveryZone {
  id: string;
  name: string;
  cities: string[];
  base_fee: number;
  estimated_days: string | null;
  is_active: boolean;
  created_at: string;
}

const emptyZone = (): Omit<DeliveryZone, "id" | "created_at"> => ({
  name: "",
  cities: [],
  base_fee: 0,
  estimated_days: "1-3 jours",
  is_active: true,
});

const DeliveryZoneManager = () => {
  const qc = useQueryClient();
  const [editZone, setEditZone] = useState<Partial<DeliveryZone> | null>(null);
  const [citiesInput, setCitiesInput] = useState("");
  const [isNew, setIsNew] = useState(false);

  const { data: zones = [], isLoading } = useQuery<DeliveryZone[]>({
    queryKey: ["delivery_zones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("*")
        .order("base_fee");
      if (error) throw error;
      return data as DeliveryZone[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (zone: Partial<DeliveryZone> & { name: string }) => {
      const payload = {
        name: zone.name,
        cities: citiesInput
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        base_fee: zone.base_fee ?? 0,
        estimated_days: zone.estimated_days ?? "1-3 jours",
        is_active: zone.is_active ?? true,
      };
      if (zone.id) {
        const { error } = await supabase.from("delivery_zones").update(payload).eq("id", zone.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("delivery_zones").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["delivery_zones"] });
      setEditZone(null);
      toast.success("Zone saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteZone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["delivery_zones"] });
      toast.success("Zone deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (zone: DeliveryZone) => {
    setIsNew(false);
    setEditZone(zone);
    setCitiesInput(zone.cities.join(", "));
  };

  const openNew = () => {
    setIsNew(true);
    setEditZone(emptyZone());
    setCitiesInput("");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Delivery Zones
              </CardTitle>
              <CardDescription>
                Define shipping zones and fees shown to customers at checkout.
              </CardDescription>
            </div>
            <Button size="sm" onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" />
              Add Zone
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone Name</TableHead>
                  <TableHead>Cities</TableHead>
                  <TableHead className="text-right">Fee (FCFA)</TableHead>
                  <TableHead>Est. Delivery</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((z) => (
                  <TableRow key={z.id}>
                    <TableCell className="font-medium">{z.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {z.cities.length > 0
                          ? z.cities.map((c) => (
                              <Badge key={c} variant="outline" className="text-xs">
                                {c}
                              </Badge>
                            ))
                          : <span className="text-muted-foreground text-xs italic">Fallback (all others)</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {z.base_fee.toLocaleString()}
                    </TableCell>
                    <TableCell>{z.estimated_days}</TableCell>
                    <TableCell>
                      <Badge variant={z.is_active ? "default" : "secondary"}>
                        {z.is_active ? "Active" : "Off"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(z)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteZone.mutate(z.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit / Create Dialog */}
      <Dialog open={!!editZone} onOpenChange={(v) => !v && setEditZone(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isNew ? "New Delivery Zone" : "Edit Zone"}</DialogTitle>
          </DialogHeader>
          {editZone && (
            <div className="space-y-4">
              <div>
                <Label>Zone Name</Label>
                <Input
                  value={editZone.name ?? ""}
                  onChange={(e) => setEditZone({ ...editZone, name: e.target.value })}
                  placeholder="e.g. Yaoundé Centre"
                />
              </div>
              <div>
                <Label>Cities (comma-separated)</Label>
                <Input
                  value={citiesInput}
                  onChange={(e) => setCitiesInput(e.target.value)}
                  placeholder="Yaoundé, Yaounde — leave empty for fallback zone"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to make this a catch-all fallback zone
                </p>
              </div>
              <div>
                <Label>Shipping Fee (FCFA)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editZone.base_fee ?? 0}
                  onChange={(e) => setEditZone({ ...editZone, base_fee: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Estimated Delivery Time</Label>
                <Input
                  value={editZone.estimated_days ?? ""}
                  onChange={(e) => setEditZone({ ...editZone, estimated_days: e.target.value })}
                  placeholder="e.g. 1-2 jours"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editZone.is_active ?? true}
                  onCheckedChange={(v) => setEditZone({ ...editZone, is_active: v })}
                />
                <Label>Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditZone(null)}>
              Cancel
            </Button>
            <Button
              disabled={upsert.isPending || !editZone?.name}
              onClick={() => editZone?.name && upsert.mutate(editZone as Partial<DeliveryZone> & { name: string })}
            >
              {upsert.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeliveryZoneManager;
