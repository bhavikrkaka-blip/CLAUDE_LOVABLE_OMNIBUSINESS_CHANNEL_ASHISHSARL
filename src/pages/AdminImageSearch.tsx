import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ImageIcon,
  Upload,
  Search,
  Loader2,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getProxiedImageUrlFromFileName } from "@/lib/imageProxy";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SearchResult {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  description: string;
  retail_price: number;
  score: number;
  images?: string[];
}

interface BackfillResult {
  processed_count: number;
  failed_count: number;
  failures?: { sku: string; error: string }[];
}

const AdminImageSearch = () => {
  // Text search state
  const [textQuery, setTextQuery] = useState("");
  const [textSearching, setTextSearching] = useState(false);

  // Image search state
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSearching, setImageSearching] = useState(false);
  const [imageDescription, setImageDescription] = useState<string | null>(null);

  // Shared results
  const [results, setResults] = useState<SearchResult[] | null>(null);

  // Backfill state
  const [backfilling, setBackfilling] = useState(false);
  const [lastResult, setLastResult] = useState<BackfillResult | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Helpers ── */
  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  };

  /** Call product-search edge function with a text query */
  const runTextSearch = async (query: string) => {
    const session = await getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ query_text: query }),
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Search failed");
    }
    const allResults = (await res.json()).results as SearchResult[];
    // Only return results with meaningful similarity (>= 25%) and cap at top 8
    return allResults.filter((r) => r.score >= 0.25).slice(0, 8);
  };

  /** Enrich results with product images from DB */
  const enrichWithImages = async (hits: SearchResult[]): Promise<SearchResult[]> => {
    if (hits.length === 0) return hits;
    const ids = hits.map((h) => h.id);
    const { data } = await supabase
      .from("products")
      .select("id, images")
      .in("id", ids);
    const imgMap: Record<string, string[]> = {};
    (data ?? []).forEach((p: any) => { imgMap[p.id] = p.images ?? []; });
    return hits.map((h) => ({ ...h, images: imgMap[h.id] ?? [] }));
  };

  /* ── Text search ── */
  const handleTextSearch = async () => {
    if (!textQuery.trim()) return;
    setTextSearching(true);
    setResults(null);
    try {
      const hits = await runTextSearch(textQuery.trim());
      setResults(await enrichWithImages(hits));
    } catch (err: any) {
      toast.error("Search failed: " + err.message);
    } finally {
      setTextSearching(false);
    }
  };

  /* ── Image search ── */
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImageDescription(null);
    setResults(null);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleImageSearch = async () => {
    if (!imageFile || !preview) {
      toast.error("Please upload an image first");
      return;
    }
    setImageSearching(true);
    setImageDescription(null);
    setResults(null);
    try {
      const session = await getSession();
      const LOVABLE_API_KEY = import.meta.env.VITE_LOVABLE_API_KEY;

      let description = "";

      // Step 1: Ask Gemini to describe the product in the image
      if (LOVABLE_API_KEY) {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Describe this product concisely for a product search query. Include the product type, color, material, brand if visible, and key features. Return only the search query, no extra text.",
                  },
                  { type: "image_url", image_url: { url: preview } },
                ],
              },
            ],
          }),
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          description = aiData.choices?.[0]?.message?.content ?? "";
        }
      }

      // Fallback: use the file name as the query
      if (!description) {
        description = imageFile.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      }

      setImageDescription(description);

      // Step 2: Use the text description to run semantic search
      const hits = await runTextSearch(description);
      setResults(await enrichWithImages(hits));
    } catch (err: any) {
      toast.error("Image search failed: " + err.message);
    } finally {
      setImageSearching(false);
    }
  };

  /* ── Backfill ── */
  const handleBackfill = async () => {
    setBackfilling(true);
    setLastResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("backfill-embeddings", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw new Error(res.error.message);
      const result = res.data as BackfillResult;
      setLastResult(result);
      if (result.failed_count === 0) {
        toast.success(`Backfill done: ${result.processed_count} processed`);
      } else {
        toast.warning(`Backfill done: ${result.processed_count} processed, ${result.failed_count} failed`);
      }
    } catch (err: any) {
      toast.error("Backfill failed: " + (err.message || "Unknown error"));
    } finally {
      setBackfilling(false);
    }
  };

  const total = lastResult ? lastResult.processed_count + lastResult.failed_count : 0;
  const successRate = total > 0 ? Math.round((lastResult!.processed_count / total) * 100) : 0;
  const isSearching = textSearching || imageSearching;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold flex items-center gap-2">
        <Search className="h-5 w-5 text-primary" />
        AI Product Search
      </h1>

      {/* Search Tabs */}
      <Tabs defaultValue="text">
        <TabsList>
          <TabsTrigger value="text">
            <Search className="h-4 w-4 mr-1" />
            Text Search
          </TabsTrigger>
          <TabsTrigger value="image">
            <Camera className="h-4 w-4 mr-1" />
            Image Search
          </TabsTrigger>
        </TabsList>

        {/* Text Search Tab */}
        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Semantic Text Search</CardTitle>
              <CardDescription>
                Describe what you're looking for — AI finds the most similar products.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder='e.g. "blue leather sofa" or "LG TV under 200000"'
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTextSearch()}
                  className="flex-1"
                />
                <Button onClick={handleTextSearch} disabled={textSearching || !textQuery.trim()}>
                  {textSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Image Search Tab */}
        <TabsContent value="image" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search by Product Image</CardTitle>
              <CardDescription>
                Upload a photo of a product and AI will find similar items in your catalog.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="w-full max-w-sm mx-auto aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {preview ? (
                  <img src={preview} alt="Uploaded" className="w-full h-full object-contain rounded-lg" />
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload a product photo</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

              {imageDescription && (
                <div className="text-xs text-muted-foreground bg-muted rounded p-2">
                  <span className="font-medium">AI interpreted as:</span> "{imageDescription}"
                </div>
              )}

              <div className="flex gap-2 justify-center">
                {preview && (
                  <Button variant="outline" size="sm" onClick={() => { setPreview(null); setImageFile(null); setImageDescription(null); setResults(null); }}>
                    Clear
                  </Button>
                )}
                <Button onClick={handleImageSearch} disabled={imageSearching || !preview}>
                  {imageSearching ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Searching…</>
                  ) : (
                    <><Search className="h-4 w-4 mr-2" />Find Similar Products</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results */}
      {(isSearching || results !== null) && (
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground">
            {isSearching ? "Searching…" : results?.length === 0 ? "No results found" : `${results?.length} result${results?.length !== 1 ? "s" : ""}`}
          </h2>

          {isSearching ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : results && results.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((r) => {
                const imgSrc =
                  r.images && r.images.length > 0
                    ? getProxiedImageUrlFromFileName(r.images[0])
                    : null;
                return (
                  <Card key={r.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                      {imgSrc ? (
                        <img src={imgSrc} alt={r.name} className="w-full h-full object-contain" />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                      )}
                    </div>
                    <CardContent className="p-3 space-y-1">
                      <p className="text-xs font-semibold leading-tight line-clamp-2">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.brand}</p>
                      <p className="text-sm font-bold">{Number(r.retail_price).toLocaleString()} FCFA</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] px-1">{r.category}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {Math.round(r.score * 100)}% match
                        </span>
                      </div>
                      {r.sku && (
                        <p className="text-[10px] text-muted-foreground font-mono">SKU: {r.sku}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-12">
              No products found. Try a different query, or run Backfill Embeddings below.
            </p>
          )}
        </div>
      )}

      {/* Backfill Section */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Backfill Embeddings</p>
              <p className="text-xs text-muted-foreground">
                Generate missing text embeddings for all products (required for AI search)
              </p>
            </div>
            <Button onClick={handleBackfill} disabled={backfilling} variant="outline">
              {backfilling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
              {backfilling ? "Processing…" : "Backfill"}
            </Button>
          </div>

          {lastResult && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center gap-3">
                {lastResult.failed_count === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {total === 0 ? "No products needed backfilling" : `${total} products processed`}
                    </span>
                    {total > 0 && (
                      <Badge variant={lastResult.failed_count === 0 ? "default" : "secondary"} className="text-xs">
                        {successRate}% success
                      </Badge>
                    )}
                  </div>
                  {total > 0 && <Progress value={successRate} className="h-2" />}
                </div>
              </div>
              {total > 0 && (
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    {lastResult.processed_count} succeeded
                  </span>
                  {lastResult.failed_count > 0 && (
                    <span className="flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                      {lastResult.failed_count} failed
                    </span>
                  )}
                </div>
              )}
              {lastResult.failures && lastResult.failures.length > 0 && (
                <div className="bg-muted/50 rounded-md p-3 space-y-1 max-h-40 overflow-y-auto">
                  <p className="text-xs font-medium text-destructive mb-1">Failed items:</p>
                  {lastResult.failures.map((f, i) => (
                    <p key={i} className="text-xs text-muted-foreground font-mono">
                      <span className="font-semibold">{f.sku}</span>: {f.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminImageSearch;
