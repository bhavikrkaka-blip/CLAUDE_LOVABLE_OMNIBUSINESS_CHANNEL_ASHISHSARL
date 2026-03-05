import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const initialForm = {
  sku: "",
  name: "",
  retail_price: "",
  cost_price: "",
  wholesale_price: "",
  barcode: "",
  brand: "",
  category: "",
  reorder_level: "",
};

const AdminCreateProduct = () => {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.sku.trim() || !form.name.trim() || !form.retail_price) {
      toast.error("SKU, Name, and Retail Price are required");
      return;
    }

    const retailPrice = parseFloat(form.retail_price);
    if (isNaN(retailPrice) || retailPrice < 0) {
      toast.error("Retail Price must be a valid number >= 0");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Not authenticated");
        return;
      }

      const body: Record<string, unknown> = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        retail_price: retailPrice,
      };

      if (form.barcode.trim()) body.barcode = form.barcode.trim();
      if (form.brand.trim()) body.brand = form.brand.trim();
      if (form.category.trim()) body.category = form.category.trim();
      if (form.cost_price) body.cost_price = parseFloat(form.cost_price);
      if (form.wholesale_price) body.wholesale_price = parseFloat(form.wholesale_price);
      if (form.reorder_level) body.reorder_level = parseInt(form.reorder_level, 10);

      const { data, error } = await supabase.functions.invoke("manage-products-master", {
        method: "POST",
        body,
      });

      if (error) throw error;

      toast.success(`Product created! ID: ${data.id}`);
      setForm(initialForm);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create product";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/admin"><ArrowLeft className="h-4 w-4 mr-2" />Back to Admin</Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create Product (ERP)</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input id="sku" name="sku" value={form.sku} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retail_price">Retail Price *</Label>
                <Input id="retail_price" name="retail_price" type="number" min="0" step="0.01" value={form.retail_price} onChange={handleChange} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost_price">Cost Price</Label>
                  <Input id="cost_price" name="cost_price" type="number" min="0" step="0.01" value={form.cost_price} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wholesale_price">Wholesale Price</Label>
                  <Input id="wholesale_price" name="wholesale_price" type="number" min="0" step="0.01" value={form.wholesale_price} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input id="barcode" name="barcode" value={form.barcode} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" name="brand" value={form.brand} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" value={form.category} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorder_level">Reorder Level</Label>
                <Input id="reorder_level" name="reorder_level" type="number" min="0" value={form.reorder_level} onChange={handleChange} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Product
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCreateProduct;
