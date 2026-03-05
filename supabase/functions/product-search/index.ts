import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateTextEmbedding(apiKey: string, text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI error [${response.status}]: ${errText}`);
  }

  const data = await response.json();
  const embedding = data?.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Invalid embedding response from OpenAI");
  }
  return embedding;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startMs = Date.now();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const adminClient = createClient(supabaseUrl, supabaseKey);
    const { query_text } = await req.json();

    if (!query_text || typeof query_text !== "string" || query_text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "query_text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const trimmed = query_text.trim();

    // Generate query embedding
    const embeddingStartMs = Date.now();
    const embedding = await generateTextEmbedding(OPENAI_API_KEY, trimmed);
    const embeddingMs = Date.now() - embeddingStartMs;
    console.log(`Query embedding generated in ${embeddingMs}ms`);

    const vectorStr = `[${embedding.join(",")}]`;

    // Hybrid search via DB function
    const { data, error } = await adminClient.rpc("search_products_by_text", {
      query_vector: vectorStr,
      search_text: trimmed,
      result_limit: 20,
    });

    if (error) throw error;

    const totalMs = Date.now() - startMs;
    console.log(`Product search completed in ${totalMs}ms — ${data?.length ?? 0} results`);

    return new Response(
      JSON.stringify({
        results: (data || []).map((p: any) => ({
          sku: p.sku,
          name: p.name,
          brand: p.brand,
          category: p.category,
          retail_price: p.retail_price,
          similarity_score: p.score,
        })),
        timing_ms: totalMs,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("product-search error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
