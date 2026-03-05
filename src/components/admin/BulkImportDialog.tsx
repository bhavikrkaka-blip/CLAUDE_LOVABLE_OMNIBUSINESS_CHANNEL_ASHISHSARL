import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { useCreateProduct } from "@/hooks/useProducts";

interface BulkProduct {
  name: string;
  name_fr?: string;
  brand: string;
  category: string;
  price: number;
  original_price?: number;
  description?: string;
  description_fr?: string;
  features?: string[];
  features_fr?: string[];
  images?: string[];
  in_stock?: boolean;
  is_new?: boolean;
}

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BulkImportDialog: React.FC<BulkImportDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [csvContent, setCsvContent] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createProduct = useCreateProduct();

  const sampleCSV = `name,brand,category,price,original_price,description,in_stock,is_new
"Samsung 55 inch Smart TV",SAMSUNG,TELEVISEUR,450000,500000,"55 inch 4K Smart TV with HDR",true,true
"LG Split AC 1.5HP",LG,CLIMATISEUR,350000,,"1.5 Horsepower Split Air Conditioner",true,false
"Hisense Chest Freezer 300L",HISENSE,CONGELATEUR,280000,300000,"300 Liter capacity chest freezer",true,false`;

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csv: string): BulkProduct[] => {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV must have a header row and at least one data row");
    }

    const headers = parseCSVLine(lines[0]);
    const products: BulkProduct[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0 || values.every((v) => !v.trim())) continue;

      const product: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        const value = values[index]?.trim() || "";
        const key = header.trim().toLowerCase();

        if (key === "price" || key === "original_price") {
          product[key] = value ? parseInt(value, 10) : undefined;
        } else if (key === "in_stock" || key === "is_new") {
          product[key] = value.toLowerCase() === "true";
        } else if (key === "features" || key === "features_fr" || key === "images") {
          product[key] = value ? value.split("|").map((s) => s.trim()) : [];
        } else {
          product[key] = value || undefined;
        }
      });

      // Validate required fields
      if (!product.name || !product.brand || !product.category || !product.price) {
        throw new Error(
          `Row ${i + 1}: Missing required fields (name, brand, category, price)`
        );
      }

      products.push(product as unknown as BulkProduct);
    }

    return products;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);

    return result.map((s) => s.replace(/^"|"$/g, ""));
  };

  const handleImport = async () => {
    if (!csvContent.trim()) {
      toast.error("Please paste or upload CSV content");
      return;
    }

    setIsImporting(true);
    try {
      const products = parseCSV(csvContent);
      setImportProgress({ current: 0, total: products.length });

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < products.length; i++) {
        try {
          await createProduct.mutateAsync({
            name: products[i].name,
            name_fr: products[i].name_fr || null,
            brand: products[i].brand,
            category: products[i].category,
            price: products[i].price,
            original_price: products[i].original_price || null,
            description: products[i].description || null,
            description_fr: products[i].description_fr || null,
            features: products[i].features || [],
            features_fr: products[i].features_fr || [],
            images: products[i].images || [],
            in_stock: products[i].in_stock ?? true,
            is_new: products[i].is_new ?? false,
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to import product ${i + 1}:`, error);
          errorCount++;
        }
        setImportProgress({ current: i + 1, total: products.length });
      }

      if (errorCount === 0) {
        toast.success(`Successfully imported ${successCount} products`);
      } else {
        toast.warning(
          `Imported ${successCount} products, ${errorCount} failed`
        );
      }

      setCsvContent("");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to parse CSV"
      );
    } finally {
      setIsImporting(false);
      setImportProgress({ current: 0, total: 0 });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Import Products
          </DialogTitle>
          <DialogDescription>
            Import multiple products at once using CSV format. Download the
            template for the correct format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">CSV Template</p>
              <p className="text-sm text-muted-foreground">
                Download sample template with correct column headers
              </p>
            </div>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV File
              </Button>
              <span className="text-sm text-muted-foreground">
                or paste content below
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* CSV Content */}
          <div className="space-y-2">
            <Textarea
              placeholder={`Paste CSV content here...\n\nFormat:\nname,brand,category,price,original_price,description,in_stock,is_new\n"Product Name",BRAND,CATEGORY,100000,120000,"Description",true,false`}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Required columns: name, brand, category, price. Optional: original_price, description, description_fr, name_fr, features (pipe-separated), images (pipe-separated), in_stock, is_new
            </p>
          </div>

          {/* Progress */}
          {isImporting && importProgress.total > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importing products...</span>
                <span>
                  {importProgress.current} / {importProgress.total}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${(importProgress.current / importProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={isImporting || !csvContent.trim()}>
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Products
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportDialog;
