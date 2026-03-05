import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, Download, Wand2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getProxiedImageUrlFromFileName } from "@/lib/imageProxy";
import { cn } from "@/lib/utils";

interface ProcessedImage {
  originalPreview: string;
  processedUrl: string;
  fileName: string;
}

const AIImageStudio = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ProcessedImage[]>([]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
        toast.error(`${f.name}: Invalid format. Use JPEG, PNG, or WebP.`);
        return false;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name}: File too large (max 10MB).`);
        return false;
      }
      return true;
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const processImages = async () => {
    if (selectedFiles.length === 0) return;
    setProcessing(true);
    setResults([]);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast.error("Not authenticated");
      setProcessing(false);
      return;
    }

    for (let i = 0; i < selectedFiles.length; i++) {
      setCurrentIndex(i);
      const file = selectedFiles[i];

      try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-product-image`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            body: formData,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          toast.error(`${file.name}: ${data.error || "Processing failed"}`);
          continue;
        }

        setResults((prev) => [
          ...prev,
          {
            originalPreview: previews[i],
            processedUrl: getProxiedImageUrlFromFileName(data.fileName),
            fileName: data.fileName,
          },
        ]);

        toast.success(`${file.name} processed successfully!`);
      } catch (err) {
        toast.error(`${file.name}: Processing failed`);
        console.error(err);
      }
    }

    setProcessing(false);
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setPreviews([]);
    setResults([]);
    setCurrentIndex(0);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            AI Image Studio
          </CardTitle>
          <CardDescription>
            Upload raw product photos and AI will remove the background, adding a professional
            studio-style white backdrop with subtle shadow for a polished e-commerce look.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
              dragActive
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
            onClick={() => document.getElementById("ai-studio-input")?.click()}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drag & drop product photos here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPEG, PNG, or WebP • Max 10MB each
            </p>
            <input
              id="ai-studio-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>

          {/* Selected files preview */}
          {previews.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  {previews.length} image{previews.length > 1 ? "s" : ""} selected
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearAll} disabled={processing}>
                    Clear All
                  </Button>
                  <Button size="sm" onClick={processImages} disabled={processing}>
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing {currentIndex + 1}/{selectedFiles.length}...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Process All
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative group aspect-square">
                    <img
                      src={src}
                      alt={`Upload ${idx + 1}`}
                      className="w-full h-full object-cover rounded-lg border"
                    />
                    {processing && idx === currentIndex && (
                      <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                    {!processing && (
                      <button
                        onClick={() => removeFile(idx)}
                        className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Processed Images ({results.length})
            </CardTitle>
            <CardDescription>
              Before → After comparison. These images are now stored and ready to use in your product catalog.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-xl bg-muted/20"
                >
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Original
                    </p>
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                      <img
                        src={result.originalPreview}
                        alt="Original"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-primary uppercase tracking-wide">
                      Processed (Studio Background)
                    </p>
                    <div className="aspect-square bg-background rounded-lg overflow-hidden border">
                      <img
                        src={result.processedUrl}
                        alt="Processed"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground break-all">
                      File: {result.fileName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIImageStudio;
