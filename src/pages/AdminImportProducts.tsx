import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Download, FileSpreadsheet, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const sampleCSV = `sku,name,category,brand,cost_price,retail_price,wholesale_price,barcode,description
"SKU-001","Samsung 55 TV","TELEVISEUR","SAMSUNG",250000,450000,380000,"123456789","55 inch Smart TV"
"SKU-002","LG Split AC 1.5HP","CLIMATISEUR","LG",200000,350000,300000,,"1.5HP Split AC"`;

interface ImportResult {
  total_inserted: number;
  duplicates_skipped: number;
  duplicate_skus: string[];
  validation_errors: string[];
  total_rows_parsed: number;
}

const AdminImportProducts = () => {
  const [csvContent, setCsvContent] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products_master_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setCsvContent(event.target?.result as string);
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvContent.trim()) {
      toast.error("Please paste or upload CSV content");
      return;
    }

    setIsImporting(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("import-products", {
        body: { csv_content: csvContent },
      });

      if (error) {
        toast.error(error.message || "Import failed");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setResult(data as ImportResult);

      if (data.total_inserted > 0) {
        toast.success(`${data.total_inserted} products imported successfully`);
      }
      if (data.duplicates_skipped > 0) {
        toast.info(`${data.duplicates_skipped} duplicate SKUs skipped`);
      }
      if (data.validation_errors?.length > 0) {
        toast.warning(`${data.validation_errors.length} rows had validation errors`);
      }
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <FileSpreadsheet className="h-5 w-5 text-primary" />
        Bulk Import Products
      </h1>

      {/* Template */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">CSV Template</p>
            <p className="text-xs text-muted-foreground">
              Required: sku, name, category, cost_price, retail_price. Optional: wholesale_price, brand, barcode, description
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </CardContent>
      </Card>

      {/* Upload / Paste */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">CSV Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV
            </Button>
            <span className="text-xs text-muted-foreground">or paste below</span>
          </div>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          <Textarea
            placeholder={`sku,name,category,cost_price,retail_price,wholesale_price\n"SKU-001","Product Name","CATEGORY",100000,150000,130000`}
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            className="min-h-[200px] font-mono text-xs"
          />
          <div className="flex justify-end">
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
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Import Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <Badge variant="default" className="text-sm py-1 px-3">
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                {result.total_inserted} inserted
              </Badge>
              {result.duplicates_skipped > 0 && (
                <Badge variant="secondary" className="text-sm py-1 px-3">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  {result.duplicates_skipped} duplicates skipped
                </Badge>
              )}
              <Badge variant="outline" className="text-sm py-1 px-3">
                {result.total_rows_parsed} rows parsed
              </Badge>
            </div>

            {result.duplicate_skus.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Duplicate SKUs:</p>
                <p className="text-xs font-mono bg-muted p-2 rounded">{result.duplicate_skus.join(", ")}</p>
              </div>
            )}

            {result.validation_errors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-destructive mb-1">Validation Errors:</p>
                <div className="text-xs font-mono bg-destructive/5 p-2 rounded space-y-0.5 max-h-[200px] overflow-y-auto">
                  {result.validation_errors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminImportProducts;
