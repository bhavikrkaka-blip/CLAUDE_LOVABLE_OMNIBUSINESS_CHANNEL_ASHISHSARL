import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const reqUrl = new URL(req.url);
    const path = reqUrl.searchParams.get("path");
    const bucket = reqUrl.searchParams.get("bucket") || "product-images";
    const externalUrl = reqUrl.searchParams.get("url");

    // Mode 1: Proxy an external URL (hide source from visitors)
    if (externalUrl) {
      const extResponse = await fetch(externalUrl);
      if (!extResponse.ok || !extResponse.body) {
        return new Response(JSON.stringify({ error: "Image not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const contentType = extResponse.headers.get("Content-Type") || "image/jpeg";

      return new Response(extResponse.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // Mode 2: Serve from Supabase storage bucket
    if (!path) {
      return new Response(JSON.stringify({ error: "Missing path or url parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Image not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ext = path.split(".").pop()?.toLowerCase() || "";
    const contentTypeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      svg: "image/svg+xml",
      avif: "image/avif",
    };
    const contentType = contentTypeMap[ext] || "application/octet-stream";

    return new Response(data, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    console.error("serve-image error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
