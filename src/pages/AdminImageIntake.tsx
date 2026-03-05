import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Camera,
  Upload,
  Loader2,
  Check,
  Trash2,
  ImagePlus,
  X,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";

const DEFAULT_CATEGORIES = [
  "TV & Entertainment",
  "Living Room Furniture",
  "Bedroom Furniture",
  "Kitchen & Dining",
  "Appliances",
  "Home Decor",
  "Bathroom",
  "Outdoor",
  "Office",
  "Storage",
  "Lighting",
  "Crockery",
  "Other",
];

function generatePrefix(category: string): string {
  const cleaned = category.replace(/[^a-zA-Z]/g, "").toUpperCase();
  return cleaned.slice(0, 3) || "GEN";
}

function generateSku(category: string): string {
  return `${generatePrefix(category)}-${Date.now()}`;
}

type ItemStatus =
  | "uploading"
  | "analyzing"
  | "refining"
  | "ready"
  | "approving"
  | "approved"
  | "rejected"
  | "error";

interface DuplicateMatch {
  sku: string;
  name: string;
  score: number;
  type: "image" | "text";
  image_url?: string;
}

interface IntakeItem {
  id: string;
  file: File;
  storagePath: string;
  rawPreviewUrl: string;
  refinedPreviewUrl: string;
  refinedStoragePath: string;
  status: ItemStatus;
  suggested_category: string;
  suggested_product_name: string;
  confidence_score: number;
  sku: string;
  skuManuallyEdited: boolean;
  cost_price: string;
  retail_price: string;
  wholesale_price: string;
  error?: string;
  fadingOut?: boolean;
  duplicates?: DuplicateMatch[];
}

type FilterMode = "unprocessed" | "low_confidence" | "by_category" | "all";

const INPUT_CLASS = "min-h-[40px] text-[15px] px-3 py-2 border border-input rounded-md bg-background";

const AdminImageIntake = () => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [items, setItems] = useState<IntakeItem[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [filterMode, setFilterMode] = useState<FilterMode>("unprocessed");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [showRawMap, setShowRawMap] = useState<Record<string, boolean>>({});
  const [previewItem, setPreviewItem] = useState<IntakeItem | null>(null);
  const [previewShowRaw, setPreviewShowRaw] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [newCategoryInput, setNewCategoryInput] = useState<Record<string, string>>({});
  const [overrideReasons, setOverrideReasons] = useState<Record<string, string>>({});

  const updateItem = useCallback((id: string, patch: Partial<IntakeItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const checkDuplicates = useCallback(async (item: IntakeItem) => {
    try {
      const duplicates: DuplicateMatch[] = [];

      // Helper to extract image URL from product description
      const extractImageUrl = (description?: string) => {
        if (!description) return undefined;
        const match = description.match(/Image:\s*(https?:\/\/\S+)/);
        return match?.[1];
      };

      // Text similarity check
      if (item.suggested_product_name) {
        const textQuery = [item.suggested_product_name, item.suggested_category].filter(Boolean).join(" ");
        const textRes = await supabase.functions.invoke("product-search", {
          body: { query_text: textQuery },
        });
        if (textRes.data?.results) {
          for (const r of textRes.data.results) {
            const distance = 1 - (r.score || 0);
            if (distance < 0.20) {
              duplicates.push({ sku: r.sku, name: r.name, score: r.score, type: "text", image_url: extractImageUrl(r.description) });
            }
          }
        }
      }

      // Image similarity check
      const imageUrl = item.refinedPreviewUrl || item.rawPreviewUrl;
      if (imageUrl && imageUrl.startsWith("http")) {
        const imgRes = await supabase.functions.invoke("product-search", {
          body: { query_image: imageUrl },
        });
        if (imgRes.data?.results) {
          for (const r of imgRes.data.results) {
            const distance = 1 - (r.score || 0);
            if (distance < 0.15) {
              if (!duplicates.some((d) => d.sku === r.sku)) {
                duplicates.push({ sku: r.sku, name: r.name, score: r.score, type: "image", image_url: extractImageUrl(r.description) });
              }
            }
          }
        }
      }

      if (duplicates.length > 0) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, duplicates } : i)));
      }
    } catch (err) {
      console.error("Duplicate check failed:", err);
    }
  }, []);

  // Trigger duplicate check when items reach "ready" status
  const checkedIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const item of items) {
      if (item.status === "ready" && !checkedIds.current.has(item.id)) {
        checkedIds.current.add(item.id);
        checkDuplicates(item);
      }
    }
  }, [items, checkDuplicates]);

  const toggleRaw = (id: string) => {
    setShowRawMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Stats
  const totalItems = items.length;
  const processedItems = items.filter((i) => i.status === "approved" || i.status === "rejected").length;
  const progressPercent = totalItems > 0 ? (processedItems / totalItems) * 100 : 0;

  const handleCategoryChange = (itemId: string, category: string, item: IntakeItem) => {
    const patch: Partial<IntakeItem> = { suggested_category: category };
    if (!item.skuManuallyEdited) {
      patch.sku = generateSku(category);
    }
    updateItem(itemId, patch);
  };

  const handleSkuChange = (itemId: string, value: string) => {
    updateItem(itemId, { sku: value, skuManuallyEdited: value.length > 0 });
  };

  const handleCreateCategory = (itemId: string, item: IntakeItem) => {
    const raw = newCategoryInput[itemId]?.trim();
    if (!raw) return;
    const normalized = raw.charAt(0).toUpperCase() + raw.slice(1);
    const exists = categories.some((c) => c.toLowerCase() === normalized.toLowerCase());
    if (!exists) {
      setCategories((prev) => [...prev, normalized]);
    }
    handleCategoryChange(itemId, normalized, item);
    setNewCategoryInput((prev) => ({ ...prev, [itemId]: "" }));
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    for (const file of files) {
      const id = crypto.randomUUID();
      const ext = file.name.split(".").pop() || "jpg";
      const storagePath = `intake/${id}.${ext}`;
      const rawPreviewUrl = URL.createObjectURL(file);

      const newItem: IntakeItem = {
        id,
        file,
        storagePath,
        rawPreviewUrl,
        refinedPreviewUrl: "",
        refinedStoragePath: "",
        status: "uploading",
        suggested_category: "",
        suggested_product_name: "",
        confidence_score: 0,
        sku: "",
        skuManuallyEdited: false,
        cost_price: "",
        retail_price: "",
        wholesale_price: "",
      };

      setItems((prev) => [...prev, newItem]);

      const { error: uploadErr } = await supabase.storage
        .from("raw-images")
        .upload(storagePath, file, { contentType: file.type, upsert: true });

      if (uploadErr) {
        updateItem(id, { status: "error", error: uploadErr.message });
        continue;
      }

      updateItem(id, { status: "analyzing" });

      const { data: signedData } = await supabase.storage
        .from("raw-images")
        .createSignedUrl(storagePath, 600);

      if (!signedData?.signedUrl) {
        updateItem(id, { status: "error", error: "Failed to create signed URL" });
        continue;
      }

      try {
        const { data, error } = await supabase.functions.invoke(
          "categorize-product-image",
          { body: { image_url: signedData.signedUrl } }
        );

        if (error) throw error;

        const autoSku = generateSku(data.suggested_category);

        updateItem(id, {
          status: "refining",
          suggested_category: data.suggested_category,
          suggested_product_name: data.suggested_product_name,
          confidence_score: data.confidence_score,
          sku: autoSku,
        });

        const refinedPath = `refined/${id}.jpg`;
        try {
          const { data: refData, error: refErr } = await supabase.functions.invoke(
            "refine-product-image",
            { body: { image_url: signedData.signedUrl, output_path: refinedPath } }
          );

          if (refErr) throw refErr;

          updateItem(id, {
            status: "ready",
            refinedPreviewUrl: refData.refined_url || "",
            refinedStoragePath: refData.storage_path || refinedPath,
          });
        } catch (refineErr: any) {
          updateItem(id, {
            status: "ready",
            refinedPreviewUrl: "",
            refinedStoragePath: "",
            error: "Refinement failed: " + (refineErr.message || "Unknown"),
          });
        }
      } catch (err: any) {
        updateItem(id, {
          status: "error",
          error: err.message || "AI categorization failed",
        });
      }
    }

    if (fileRef.current) fileRef.current.value = "";
  };

  const focusNextCard = (currentId: string) => {
    const readyItems = items.filter((i) => i.status === "ready" && i.id !== currentId);
    if (readyItems.length > 0) {
      const nextId = readyItems[0].id;
      setTimeout(() => {
        cardRefs.current[nextId]?.scrollIntoView({ behavior: "smooth", block: "center" });
        const nameInput = cardRefs.current[nextId]?.querySelector<HTMLInputElement>('input[data-field="name"]');
        nameInput?.focus();
      }, 400);
    }
  };

  const handleApprove = async (item: IntakeItem) => {
    if (!item.suggested_product_name.trim() || !item.suggested_category || !item.sku.trim()) {
      toast({ title: "Missing fields", description: "Name, category, and SKU are required.", variant: "destructive" });
      return;
    }

    const hasDuplicates = item.duplicates && item.duplicates.length > 0;
    const overrideReason = overrideReasons[item.id]?.trim() || null;

    if (hasDuplicates && !overrideReason) {
      toast({ title: "Override reason required", description: "Please provide a reason to approve a potential duplicate.", variant: "destructive" });
      return;
    }

    updateItem(item.id, { status: "approving" });

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const destPath = `${item.suggested_category}/${item.sku}/main.jpg`;

      const sourceBucket = item.refinedStoragePath ? "processed-images" : "raw-images";
      const sourcePath = item.refinedStoragePath || item.storagePath;

      const { data: fileData, error: dlErr } = await supabase.storage
        .from(sourceBucket)
        .download(sourcePath);

      if (dlErr || !fileData) throw new Error("Failed to download image");

      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(destPath, fileData, { contentType: "image/jpeg", upsert: true });

      if (upErr) throw new Error("Failed to upload to product-images: " + upErr.message);

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(destPath);

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-products-master`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            sku: item.sku,
            name: item.suggested_product_name,
            category: item.suggested_category,
            brand: "—",
            cost_price: Math.max(0, Number(item.cost_price) || 0),
            retail_price: Math.max(0, Number(item.retail_price) || 0),
            wholesale_price: Math.max(0, Number(item.wholesale_price) || 0),
            reorder_level: 0,
            description: `Image: ${publicUrlData.publicUrl}`,
            duplicate_override_reason: overrideReason,
            main_image_path: destPath,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Product creation failed");
      }

      const resData = await res.json();
      const productId = resData.id;

      await supabase.storage.from("raw-images").remove([item.storagePath]);
      if (item.refinedStoragePath) {
        await supabase.storage.from("processed-images").remove([item.refinedStoragePath]);
      }

      // Fade out then mark approved
      updateItem(item.id, { fadingOut: true });
      setTimeout(() => {
        updateItem(item.id, { status: "approved", fadingOut: false });
        focusNextCard(item.id);
      }, 350);

      toast({ title: "Product approved", description: `${item.suggested_product_name} created.` });

      // Fire-and-forget: generate embeddings asynchronously
      const textInput = [
        item.suggested_product_name,
        item.suggested_category,
        "—", // brand
      ].filter(Boolean).join(" ");

      fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-embeddings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            product_id: productId,
            text_input: textInput,
            image_url: publicUrlData.publicUrl,
          }),
        }
      ).then(async (embRes) => {
        if (!embRes.ok) {
          console.error("Embedding generation failed:", await embRes.text());
        } else {
          const embData = await embRes.json();
          if (embData.errors?.length) {
            console.warn("Embedding partial failures:", embData.errors);
          } else {
            console.log("Embeddings generated for product:", productId);
          }
        }
      }).catch((embErr) => {
        console.error("Embedding generation error:", embErr);
      });
    } catch (err: any) {
      updateItem(item.id, { status: "ready", error: err.message });
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleReject = async (item: IntakeItem) => {
    await supabase.storage.from("raw-images").remove([item.storagePath]);
    if (item.refinedStoragePath) {
      await supabase.storage.from("processed-images").remove([item.refinedStoragePath]);
    }
    updateItem(item.id, { fadingOut: true });
    setTimeout(() => {
      updateItem(item.id, { status: "rejected", fadingOut: false });
    }, 350);
  };

  const handleRemove = (item: IntakeItem) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const filteredItems = items.filter((item) => {
    if (item.status === "approved" || item.status === "rejected") {
      if (filterMode !== "all") return false;
    }
    switch (filterMode) {
      case "unprocessed":
        return item.status !== "approved" && item.status !== "rejected";
      case "low_confidence":
        return item.confidence_score > 0 && item.confidence_score < 0.7;
      case "by_category":
        return filterCategory ? item.suggested_category === filterCategory : true;
      case "all":
        return true;
      default:
        return true;
    }
  });

  const confidenceBadge = (score: number) => {
    if (score <= 0) return null;
    const pct = (score * 100).toFixed(0);
    if (score >= 0.8) return <Badge className="bg-green-600 text-white text-xs">{pct}%</Badge>;
    if (score >= 0.6) return <Badge className="bg-yellow-500 text-white text-xs">{pct}%</Badge>;
    return <Badge className="bg-red-500 text-white text-xs">{pct}%</Badge>;
  };

  const statusBadge = (status: ItemStatus) => {
    switch (status) {
      case "uploading":
        return <Badge variant="outline" className="text-xs"><Loader2 className="h-3 w-3 animate-spin mr-1" />Uploading</Badge>;
      case "analyzing":
        return <Badge variant="outline" className="text-xs"><Loader2 className="h-3 w-3 animate-spin mr-1" />Analyzing</Badge>;
      case "refining":
        return <Badge variant="outline" className="text-xs text-blue-600"><Loader2 className="h-3 w-3 animate-spin mr-1" />Refining</Badge>;
      case "ready":
        return <Badge className="text-xs bg-green-100 text-green-800">Ready</Badge>;
      case "approving":
        return <Badge variant="outline" className="text-xs"><Loader2 className="h-3 w-3 animate-spin mr-1" />Saving</Badge>;
      case "approved":
        return <Badge className="text-xs bg-green-600 text-white">✓ Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
      case "error":
        return <Badge variant="destructive" className="text-xs">Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 w-full px-6 -mx-4 md:-mx-6 lg:-mx-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Image Intake
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unprocessed">Unprocessed only</SelectItem>
              <SelectItem value="low_confidence">Low confidence (&lt;70%)</SelectItem>
              <SelectItem value="by_category">By category</SelectItem>
              <SelectItem value="all">Show all</SelectItem>
            </SelectContent>
          </Select>

          {filterMode === "by_category" && (
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button onClick={() => fileRef.current?.click()}>
            <ImagePlus className="h-4 w-4 mr-2" />
            Upload Images
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="hidden"
          />
        </div>
      </div>

      {/* Progress indicator */}
      {totalItems > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Processed {processedItems} of {totalItems} images</span>
            <span>{progressPercent.toFixed(0)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      )}

      {/* Empty state */}
      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-4">
            <div
              className="w-full max-w-md border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click or drag images to start bulk intake
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                AI will auto-categorize & refine images
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card grid */}
      {filteredItems.length > 0 && (
        <div className="grid grid-cols-1 gap-5">
          {filteredItems.map((item) => {
            const showRaw = showRawMap[item.id] ?? false;
            const previewUrl = showRaw || !item.refinedPreviewUrl
              ? item.rawPreviewUrl
              : item.refinedPreviewUrl;
            const isEditable = item.status === "ready" || item.status === "error";
            const catInputVal = newCategoryInput[item.id] || "";

            const hasDuplicates = item.duplicates && item.duplicates.length > 0;

            return (
              <Card
                key={item.id}
                ref={(el) => { cardRefs.current[item.id] = el; }}
                className={`w-full overflow-hidden transition-all duration-300 ${
                  item.fadingOut ? "opacity-0 scale-95" : ""
                } ${item.status === "approved" ? "opacity-50" : ""} ${
                  item.status === "rejected" ? "opacity-30" : ""
                } ${item.status === "error" ? "border-destructive/30" : ""} ${
                  hasDuplicates ? "border-2 border-yellow-500" : ""
                }`}
              >
                <CardContent className="p-0">
                  {/* Duplicate warning panel */}
                  {hasDuplicates && (() => {
                    const topDup = item.duplicates![0];
                    const overrideVal = overrideReasons[item.id] || "";
                    return (
                      <div className="bg-yellow-50 dark:bg-yellow-950/30 border-b-2 border-yellow-400 dark:border-yellow-600 px-5 py-4">
                        <div className="flex items-start gap-3">
                          <ShieldAlert className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 space-y-3 min-w-0">
                            <p className="text-sm font-bold text-yellow-800 dark:text-yellow-300">
                              ⚠ Possible duplicate detected
                            </p>

                            {/* Top match preview */}
                            <div className="flex items-start gap-4 bg-yellow-100/60 dark:bg-yellow-900/30 rounded-lg p-3 border border-yellow-300 dark:border-yellow-700">
                              {topDup.image_url && (
                                <img
                                  src={topDup.image_url}
                                  alt={topDup.name}
                                  className="w-20 h-20 rounded-md object-contain bg-white border border-yellow-200 flex-shrink-0"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 truncate">{topDup.name}</p>
                                <p className="text-xs font-mono text-yellow-700 dark:text-yellow-400 mt-0.5">SKU: {topDup.sku}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-[10px] border-yellow-500 text-yellow-700 dark:text-yellow-400">
                                    {topDup.type === "image" ? "Image match" : "Text match"}
                                  </Badge>
                                  <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                                    {(topDup.score * 100).toFixed(0)}% similar
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* All matches list */}
                            {item.duplicates!.length > 1 && (
                              <div className="space-y-1">
                                {item.duplicates!.slice(1).map((dup, idx) => (
                                  <p key={idx} className="text-xs text-yellow-700 dark:text-yellow-400">
                                    <Badge variant="outline" className="text-[10px] mr-1.5 border-yellow-500 text-yellow-700 dark:text-yellow-400">
                                      {dup.type === "image" ? "Image" : "Text"}
                                    </Badge>
                                    <span className="font-mono font-medium">{dup.sku}</span>
                                    {" — "}{dup.name}
                                    <span className="ml-1">({(dup.score * 100).toFixed(0)}%)</span>
                                  </p>
                                ))}
                              </div>
                            )}

                            {/* Override reason textarea */}
                            <div>
                              <Label className="text-xs font-semibold text-yellow-800 dark:text-yellow-300 mb-1 block">
                                Override reason (required to approve)
                              </Label>
                              <Textarea
                                value={overrideVal}
                                onChange={(e) => setOverrideReasons((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                placeholder="Explain why this is not a duplicate..."
                                className="min-h-[60px] text-sm border-yellow-400 dark:border-yellow-600 bg-white dark:bg-yellow-950/50 focus:border-yellow-500"
                                disabled={!isEditable}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-0 lg:gap-8">
                    {/* LEFT: Image section */}
                    <div className="w-full lg:w-[480px] flex-shrink-0 bg-muted/30 p-5 flex flex-col items-center justify-center gap-3">
                      <div
                        className="relative w-full aspect-square rounded-lg overflow-hidden border border-border bg-background cursor-pointer"
                        onClick={() => {
                          setPreviewItem(item);
                          setPreviewShowRaw(false);
                          setPreviewZoom(1);
                        }}
                      >
                        <img
                          src={previewUrl}
                          alt="Product"
                          className="w-full h-full object-contain"
                        />
                        {showRaw && item.refinedPreviewUrl && (
                          <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded">RAW</span>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors">
                          <ZoomIn className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                      </div>

                      {/* Toggle + confidence + filename */}
                      <div className="w-full flex items-center justify-between gap-2">
                        {item.refinedPreviewUrl ? (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={showRaw}
                              onCheckedChange={() => toggleRaw(item.id)}
                              id={`raw-toggle-${item.id}`}
                            />
                            <Label htmlFor={`raw-toggle-${item.id}`} className="text-xs text-muted-foreground cursor-pointer">
                              {showRaw ? "Raw" : "Refined"}
                            </Label>
                          </div>
                        ) : (
                          <div />
                        )}
                        <div className="flex items-center gap-2">
                          {confidenceBadge(item.confidence_score)}
                          {statusBadge(item.status)}
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground truncate max-w-full" title={item.file.name}>
                        {item.file.name}
                      </p>

                      {item.error && (
                        <p className="text-xs text-destructive truncate max-w-full">{item.error}</p>
                      )}
                    </div>

                    {/* RIGHT: Form section */}
                    <div className="flex-1 p-5 flex flex-col gap-4 min-w-0">
                      {/* Row 1: Product Name (full width) */}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Product Name</Label>
                        <Input
                          data-field="name"
                          value={item.suggested_product_name}
                          onChange={(e) => updateItem(item.id, { suggested_product_name: e.target.value })}
                          disabled={!isEditable}
                          className={INPUT_CLASS}
                          placeholder="Product name"
                        />
                      </div>

                      {/* Row 2: Category | SKU */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Category with inline creation */}
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Category</Label>
                          {item.status === "uploading" || item.status === "analyzing" || item.status === "refining" ? (
                            <span className="text-sm text-muted-foreground">—</span>
                          ) : (
                            <div className="space-y-2">
                              <Select
                                value={item.suggested_category}
                                onValueChange={(v) => {
                                  if (v === "__CREATE_NEW__") return;
                                  handleCategoryChange(item.id, v, item);
                                }}
                                disabled={!isEditable}
                              >
                                <SelectTrigger className={INPUT_CLASS}>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((c) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {isEditable && (
                                <div className="flex gap-2">
                                  <Input
                                    value={catInputVal}
                                    onChange={(e) => setNewCategoryInput((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                    placeholder="New category name..."
                                    className="min-h-[36px] text-sm"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleCreateCategory(item.id, item);
                                      }
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="min-h-[36px] whitespace-nowrap"
                                    disabled={!catInputVal.trim()}
                                    onClick={() => handleCreateCategory(item.id, item)}
                                  >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Add
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* SKU */}
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">SKU</Label>
                          <Input
                            value={item.sku}
                            onChange={(e) => handleSkuChange(item.id, e.target.value)}
                            disabled={!isEditable}
                            className={`${INPUT_CLASS} font-mono min-w-[220px]`}
                            placeholder="Auto-generated"
                          />
                        </div>
                      </div>

                      {/* Row 3: Cost | Retail | Wholesale */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Cost</Label>
                          <Input
                            type="number"
                            value={item.cost_price}
                            onChange={(e) => updateItem(item.id, { cost_price: e.target.value })}
                            disabled={!isEditable}
                            className={INPUT_CLASS}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Retail</Label>
                          <Input
                            type="number"
                            value={item.retail_price}
                            onChange={(e) => updateItem(item.id, { retail_price: e.target.value })}
                            disabled={!isEditable}
                            className={INPUT_CLASS}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Wholesale</Label>
                          <Input
                            type="number"
                            value={item.wholesale_price}
                            onChange={(e) => updateItem(item.id, { wholesale_price: e.target.value })}
                            disabled={!isEditable}
                            className={INPUT_CLASS}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Actions - aligned bottom-right */}
                      <div className="flex items-center justify-end gap-2 mt-auto pt-3">
                        {(item.rawPreviewUrl || item.refinedPreviewUrl) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setPreviewItem(item);
                              setPreviewShowRaw(false);
                              setPreviewZoom(1);
                            }}
                          >
                            <Maximize2 className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                        )}
                        <div className="flex-1" />
                        {item.status === "ready" && !hasDuplicates && (
                          <>
                            <Button
                              variant="outline"
                              className="text-destructive"
                              onClick={() => handleReject(item)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              onClick={() => handleApprove(item)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </>
                        )}
                        {item.status === "ready" && hasDuplicates && (
                          <>
                            <Button
                              variant="outline"
                              className="text-destructive"
                              onClick={() => handleReject(item)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              disabled={!(overrideReasons[item.id]?.trim())}
                              onClick={() => handleApprove(item)}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                              <ShieldAlert className="h-4 w-4 mr-1" />
                              Approve Anyway
                            </Button>
                          </>
                        )}
                        {item.status === "approving" && (
                          <Button disabled>
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            Saving...
                          </Button>
                        )}
                        {item.status === "approved" && (
                          <span className="text-sm text-green-600 font-medium">✓ Done</span>
                        )}
                        {(item.status === "rejected" || item.status === "error") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleRemove(item)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      <Dialog
        open={!!previewItem}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewItem(null);
            setPreviewZoom(1);
          }
        }}
      >
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] p-0 bg-black/95 border-none overflow-hidden [&>button]:text-white [&>button]:hover:text-white/80">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          {previewItem && (() => {
            const modalUrl = previewShowRaw || !previewItem.refinedPreviewUrl
              ? previewItem.rawPreviewUrl
              : previewItem.refinedPreviewUrl;
            return (
              <div className="flex flex-col h-[90vh]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <span className="text-white/80 text-sm font-medium truncate max-w-[200px]">
                      {previewItem.file.name}
                    </span>
                    {previewItem.suggested_category && (
                      <Badge variant="outline" className="text-white/70 border-white/20 text-xs">
                        {previewItem.suggested_category}
                      </Badge>
                    )}
                    {previewItem.confidence_score > 0 && (
                      <span
                        className={`text-xs font-semibold ${
                          previewItem.confidence_score >= 0.8
                            ? "text-green-400"
                            : previewItem.confidence_score >= 0.5
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {(previewItem.confidence_score * 100).toFixed(0)}% confidence
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {previewItem.refinedPreviewUrl && (
                      <div className="flex items-center gap-2">
                        <Label className="text-white/60 text-xs cursor-pointer">
                          {previewShowRaw ? "Raw" : "Refined"}
                        </Label>
                        <Switch
                          checked={previewShowRaw}
                          onCheckedChange={setPreviewShowRaw}
                        />
                      </div>
                    )}
                    <Button size="sm" variant="ghost" className="text-white/70 hover:text-white h-8" onClick={() => setPreviewZoom((z) => Math.max(0.25, z - 0.25))}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-white/50 text-xs w-12 text-center">{(previewZoom * 100).toFixed(0)}%</span>
                    <Button size="sm" variant="ghost" className="text-white/70 hover:text-white h-8" onClick={() => setPreviewZoom((z) => Math.min(4, z + 0.25))}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-white/70 hover:text-white h-8" onClick={() => setPreviewZoom(1)}>
                      Reset
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                  <img
                    src={modalUrl}
                    alt="Product preview"
                    className="transition-transform duration-200"
                    style={{ transform: `scale(${previewZoom})`, maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                    draggable={false}
                  />
                </div>

                {previewShowRaw && previewItem.refinedPreviewUrl && (
                  <div className="text-center py-2 text-white/40 text-xs">Viewing raw original image</div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminImageIntake;
