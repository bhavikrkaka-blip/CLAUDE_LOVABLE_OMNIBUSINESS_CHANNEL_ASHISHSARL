import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Loader2, Upload, Download, FileSpreadsheet, CheckCircle,
  ImagePlus, AlertCircle, ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImportResult {
  total_upserted: number;
  validation_errors: string[];
  total_rows_parsed: number;
}

interface MissingImageProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
}

const sampleCSV = `sku,name,category,brand,cost_price,retail_price,wholesale_price,barcode,description
"SKU-001","Samsung 55 TV","TELEVISEUR","SAMSUNG",250000,450000,380000,"123456789","55 inch Smart TV"
"SKU-002","LG Split AC 1.5HP","CLIMATISEUR","LG",200000,350000,300000,,"1.5HP Split AC"`;

const ProductImportHub = () => {
  const { toast } = useToast();

  // CSV Import state
  const [csvContent, setCsvContent] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const csvFileRef = useRef<HTMLInputElement>(null);
  const imageFilesRef = useRef<HTMLInputElement>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isLinkingImages, setIsLinkingImages] = useState(false);

  // Missing Images state
  const [missingImageProducts, setMissingImageProducts] = useState<MissingImageProduct[]>([]);
  const [isLoadingMissing, setIsLoadingMissing] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const perProductImageRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvContent(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setImageFiles(files);
    toast({ title: `${files.length} image(s) selected`, description: "Images should be named by SKU (e.g. SKU-001.jpg)" });
  };

  const uploadImagesForImportedProducts = async (files: File[]) => {
    let linked = 0;
    for (const file of files) {
      const skuGuess = file.name.replace(/.[^.]+$/, "").toUpperCase();
      const { data: product } = await supabase
        .from("products")
        .select("id, sku")
        .ilike("sku", skuGuess)
        .maybeSingle();
      if (!product) continue;
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `products/${product.id}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true });
      if (uploadErr) continue;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      await supabase.from("products").update({ image_url: urlData.publicUrl }).eq("id", product.id);
      linked++;
    }
    if (linked > 0) toast({ title: `${linked} product images linked successfully` });
  };

  const handleLinkImagesOnly = async () => {
    if (imageFiles.length === 0) return;
    setIsLinkingImages(true);
    try {
      await uploadImagesForImportedProducts(imageFiles);
      if (imageFiles.length > 0) {
        toast({ title: "Image linking complete" });
      }
    } catch (e: any) {
      toast({ title: "Failed to link images", description: e.message, variant: "destructive" });
    } finally {
      setIsLinkingImages(false);
    }
  };

  const handleImport = async () => {
    if (!csvContent.trim()) {
      toast({ title: "Please paste or upload a CSV file", variant: "destructive" });
      return;
    }
    setIsImporting(true);
    setImportResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("import-products", {
        body: { csv_content: csvContent },
      });
      if (error || data?.error) {
        toast({ title: data?.error || error?.message || "Import failed", variant: "destructive" });
        return;
      }
      setImportResult(data as ImportResult);
      if (imageFiles.length > 0) {
        await uploadImagesForImportedProducts(imageFiles);
      }
      if (data.total_upserted > 0) toast({ title: `${data.total_upserted} products imported / updated successfully` });
    } catch (e: any) {
      toast({ title: e.message || "Import failed", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const loadMissingImages = async () => {
    setIsLoadingMissing(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, sku, category, brand")
      .eq("is_active", true)
      .or("image_url.is.null,image_url.eq.")
      .order("name")
      .limit(200);
    setMissingImageProducts((data as MissingImageProduct[]) ?? []);
    setIsLoadingMissing(false);
  };

  const handlePerProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId) return;
    setUploadingFor(uploadTargetId);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `products/${uploadTargetId}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      await supabase.from("products").update({ image_url: urlData.publicUrl }).eq("id", uploadTargetId);
      toast({ title: "Image uploaded successfully" });
      setMissingImageProducts((prev) => prev.filter((p) => p.id !== uploadTargetId));
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploadingFor(null);
      setUploadTargetId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="csv-import">
        <TabsList>
          <TabsTrigger value="csv-import">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Bulk Import (CSV + Images)
          </TabsTrigger>
          <TabsTrigger value="missing-images" onClick={loadMissingImages}>
            <ImagePlus className="h-4 w-4 mr-2" />
            Missing Images
          </TabsTrigger>
          <TabsTrigger value="ai-intake">
            <ExternalLink className="h-4 w-4 mr-2" />
            AI Image Intake
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: CSV + Images Import */}
        <TabsContent value="csv-import" className="space-y-4 mt-4">
          <h2 className="text-base font-semibold">Bulk Import Products</h2>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Step 1: Download CSV Template</p>
                <p className="text-xs text-muted-foreground">Required: sku, name, category, cost_price, retail_price. Optional: wholesale_price, brand, barcode, description</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Step 2: Upload CSV File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => csvFileRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </Button>
                <span className="text-xs text-muted-foreground">or paste content below</span>
              </div>
              <input ref={csvFileRef} type="file" accept=".csv" onChange={handleCsvFile} className="hidden" />
              <Textarea
                placeholder={`sku,name,category,cost_price,retail_price
"SKU-001","Product Name","CATEGORY",100000,150000`}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="min-h-[150px] font-mono text-xs"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Step 3: Link Product Images (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Select images named by SKU (e.g., <code className="bg-muted px-1 rounded">SKU-001.jpg</code>). They will be automatically matched and linked to imported products.
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => imageFilesRef.current?.click()}>
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Select Images
                </Button>
                {imageFiles.length > 0 && (
                  <span className="text-xs text-green-700 font-medium">{imageFiles.length} image(s) selected</span>
                )}
              </div>
              <input ref={imageFilesRef} type="file" accept="image/*" multiple onChange={handleImageFiles} className="hidden" />
              {imageFiles.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {imageFiles.slice(0, 8).map((f) => (
                    <span key={f.name} className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{f.name}</span>
                  ))}
                  {imageFiles.length > 8 && <span className="text-xs text-muted-foreground">+{imageFiles.length - 8} more</span>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-sm">Already imported? Link images to existing products</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select images named by SKU (e.g. <code className="bg-muted px-1 rounded">SKU-001.jpg</code>) and click below — no CSV needed.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLinkImagesOnly}
                disabled={imageFiles.length === 0 || isLinkingImages}
                className="shrink-0"
              >
                {isLinkingImages ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Linking…</>
                ) : (
                  <><ImagePlus className="h-4 w-4 mr-2" />Link Images Only</>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleImport} disabled={isImporting || !csvContent.trim()} size="lg">
              {isImporting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing...</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" />Import Products</>
              )}
            </Button>
          </div>

          {importResult && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Import Results</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  <Badge className="text-sm py-1 px-3">
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    {importResult.total_upserted} inserted / updated
                  </Badge>
                  <Badge variant="outline" className="text-sm py-1 px-3">{importResult.total_rows_parsed} rows parsed</Badge>
                </div>
                {importResult.validation_errors.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-destructive mb-1">Validation Errors:</p>
                    <div className="text-xs font-mono bg-destructive/5 p-2 rounded space-y-0.5 max-h-[200px] overflow-y-auto">
                      {importResult.validation_errors.map((err, i) => <p key={i}>{err}</p>)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: Missing Images */}
        <TabsContent value="missing-images" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">Products Missing Images</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Upload images for products that don't have one yet.</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadMissingImages} disabled={isLoadingMissing}>
              {isLoadingMissing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>
          {isLoadingMissing ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : missingImageProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="font-medium text-green-700">All products have images!</p>
              <p className="text-xs mt-1">Click Refresh to check again.</p>
            </div>
          ) : (
            <>
              <div className="mb-3">
                <Badge variant="destructive">{missingImageProducts.length} products missing images</Badge>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {missingImageProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{product.sku}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{product.category}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{product.brand}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={uploadingFor === product.id}
                            onClick={() => {
                              setUploadTargetId(product.id);
                              setTimeout(() => perProductImageRef.current?.click(), 0);
                            }}
                          >
                            {uploadingFor === product.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                            ) : (
                              <ImagePlus className="h-3.5 w-3.5 mr-1" />
                            )}
                            Upload Image
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <input
                ref={perProductImageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePerProductImageUpload}
                key={uploadTargetId ?? "none"}
              />
            </>
          )}
        </TabsContent>

        {/* Tab 3: AI Image Intake */}
        <TabsContent value="ai-intake" className="mt-4">
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <ExternalLink className="h-8 w-8 mx-auto text-muted-foreground" />
              <div>
                <h2 className="text-base font-semibold">AI Image Intake Pipeline</h2>
                <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
                  Photograph products and let AI automatically categorize them, remove backgrounds, detect duplicates, and create product entries with suggested pricing.
                </p>
              </div>
              <Button onClick={() => { window.location.href = "/admin/image-intake"; }}>
                Open AI Image Intake
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductImportHub;
