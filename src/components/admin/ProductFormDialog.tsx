import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, X, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateProduct,
  useUpdateProduct,
  type Product,
} from "@/hooks/useProducts";
import SelectWithCustomOption from "./SelectWithCustomOption";
import ImageUploadSection from "./ImageUploadSection";

export const DEFAULT_CATEGORIES = [
  "CLIMATISEUR",
  "CONGELATEUR",
  "FRIGO",
  "MACHINE A LAVER",
  "TELEVISEUR",
  "VENTILATEUR",
  "MICRO ONDE",
  "CUISINIERE",
  "REGULATEUR",
  "FER A REPASSER",
  "AIR COOLER",
  "DISPENSEUR EAU",
  "ROBOT MIXEUR",
  "CHAUFFE-EAU",
  "SECHE-LINGE",
  "CAVE A VIN",
  "AUTRES",
];

export const DEFAULT_BRANDS = [
  "LG", "SAMSUNG", "SHARP", "HISENSE", "TCL", "ROCH", "WESTPOINT", "FIABTEC",
  "OCEAN", "DELTA", "SPJ", "SOLSTAR", "OSCAR", "TORNADO", "EUROLUX", "ICONA",
  "INNOVA", "SIGNATURE", "VERVE", "SUPER FLAME", "MIDEA", "BINATONE", "MEWE",
  "MILLENIUM", "DAIKIN", "ARF", "VALENCIA", "VESTEL", "SKYWORTH", "SKYWORLD",
  "MITSUMI", "BELLE FRANCE", "GOODWIN", "PREMAX", "LIGHTWAVE", "STARSAT",
  "KENWOOD", "KEPAS", "UFESA", "UBIT", "BLACK DECKER", "MR UK", "HOME BASE",
  "ASTECH", "AUX",
];

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  name_fr: z.string().optional(),
  brand: z.string().min(1, "Brand is required"),
  category: z.string().min(1, "Category is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  original_price: z.coerce.number().optional(),
  description: z.string().optional(),
  description_fr: z.string().optional(),
  in_stock: z.boolean().default(true),
  is_new: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  open,
  onOpenChange,
  product,
}) => {
  const [images, setImages] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [featuresFr, setFeaturesFr] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const [newFeatureFr, setNewFeatureFr] = useState("");

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      name_fr: "",
      brand: "",
      category: "",
      price: 0,
      original_price: undefined,
      description: "",
      description_fr: "",
      in_stock: true,
      is_new: false,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        name_fr: product.name_fr || "",
        brand: product.brand,
        category: product.category,
        price: product.price,
        original_price: product.original_price || undefined,
        description: product.description || "",
        description_fr: product.description_fr || "",
        in_stock: product.in_stock,
        is_new: product.is_new,
      });
      setImages(product.images || []);
      setFeatures(product.features || []);
      setFeaturesFr(product.features_fr || []);
    } else {
      form.reset({
        name: "",
        name_fr: "",
        brand: "",
        category: "",
        price: 0,
        original_price: undefined,
        description: "",
        description_fr: "",
        in_stock: true,
        is_new: false,
      });
      setImages([]);
      setFeatures([]);
      setFeaturesFr([]);
    }
  }, [product, form]);

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures((prev) => [...prev, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const addFeatureFr = () => {
    if (newFeatureFr.trim()) {
      setFeaturesFr((prev) => [...prev, newFeatureFr.trim()]);
      setNewFeatureFr("");
    }
  };

  const removeFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const removeFeatureFr = (index: number) => {
    setFeaturesFr((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (product) {
        await updateProduct.mutateAsync({
          id: product.id,
          updates: {
            ...data,
            images,
            features,
            features_fr: featuresFr,
            original_price: data.original_price || null,
          },
        });
        toast.success("Product updated successfully");
      } else {
        await createProduct.mutateAsync({
          name: data.name,
          brand: data.brand,
          category: data.category,
          price: data.price,
          name_fr: data.name_fr || null,
          original_price: data.original_price || null,
          description: data.description || null,
          description_fr: data.description_fr || null,
          in_stock: data.in_stock,
          is_new: data.is_new,
          images,
          features,
          features_fr: featuresFr,
        });
        toast.success("Product created successfully");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(product ? "Failed to update product" : "Failed to create product");
    }
  };

  const isSubmitting = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {product
              ? "Update the product details below"
              : "Fill in the product details to add it to your catalog"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Images */}
            <ImageUploadSection
              images={images}
              onImagesChange={setImages}
            />

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (English)</FormLabel>
                    <FormControl>
                      <Input placeholder="Product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name_fr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (French)</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du produit" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <SelectWithCustomOption
                        options={DEFAULT_BRANDS}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select brand"
                        label="Brand"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <SelectWithCustomOption
                        options={DEFAULT_CATEGORIES}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select category"
                        label="Category"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (FCFA)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="original_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Price (FCFA) - Optional</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="For discounts"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (English)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Product description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description_fr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (French)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Description du produit" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <FormLabel>Features (English)</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add feature"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addFeature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {features.map((feature, index) => (
                    <span
                      key={index}
                      className="bg-muted px-2 py-1 rounded text-sm flex items-center gap-1"
                    >
                      {feature}
                      <button type="button" onClick={() => removeFeature(index)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <FormLabel>Features (French)</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter caractéristique"
                    value={newFeatureFr}
                    onChange={(e) => setNewFeatureFr(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeatureFr())}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addFeatureFr}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {featuresFr.map((feature, index) => (
                    <span
                      key={index}
                      className="bg-muted px-2 py-1 rounded text-sm flex items-center gap-1"
                    >
                      {feature}
                      <button type="button" onClick={() => removeFeatureFr(index)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Status Flags */}
            <div className="flex items-center gap-6">
              <FormField
                control={form.control}
                name="in_stock"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">In Stock</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_new"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Mark as New</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {product ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormDialog;
