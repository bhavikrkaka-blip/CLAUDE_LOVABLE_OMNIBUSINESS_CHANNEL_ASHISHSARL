/**
 * Converts a direct Supabase storage URL to a proxied URL
 * that hides the actual storage location from visitors.
 */
export function getProxiedImageUrl(url: string | null | undefined): string {
  if (!url) return "/placeholder.svg";

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  // Already a proxied URL or relative path or local asset
  if (url.startsWith("/") || url.startsWith("data:") || url.includes("/functions/v1/serve-image")) {
    return url;
  }

  // Supabase storage URL — extract file path from bucket
  if (url.includes("supabase")) {
    try {
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split("/");
      const bucketIndex = pathParts.indexOf("product-images");
      if (bucketIndex === -1) return url;
      const filePath = pathParts.slice(bucketIndex + 1).join("/");
      return `${supabaseUrl}/functions/v1/serve-image?bucket=product-images&path=${encodeURIComponent(filePath)}`;
    } catch {
      return url;
    }
  }

  // External URL — proxy it to hide the source
  return `${supabaseUrl}/functions/v1/serve-image?url=${encodeURIComponent(url)}`;
}

/**
 * Converts a file name (from the AI processing) to a proxied URL.
 */
export function getProxiedImageUrlFromFileName(fileName: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/serve-image?bucket=product-images&path=${encodeURIComponent(fileName)}`;
}
