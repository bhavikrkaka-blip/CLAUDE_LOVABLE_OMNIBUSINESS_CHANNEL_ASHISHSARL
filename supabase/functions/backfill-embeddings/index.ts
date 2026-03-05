import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateTextEmbedding(apiKey: string, text: string): Promise<number[]> {
  const startMs = Date.now();
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

  const elapsedMs = Date.now() - startMs;
  console.log(`Embedding generated in ${elapsedMs}ms (${embedding.length} dims)`);
  return embedding;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: products, error: fetchErr } = await adminClient
      .from("products")
      .select("id, sku, name, category, brand, description")
      .is("is_active", true)
      .is("text_embedding", null)
      .limit(10);

    if (fetchErr) throw fetchErr;
    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ processed_count: 0, failed_count: 0, message: "No products need text embedding backfill" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let processedCount = 0;
    let failedCount = 0;
    const failures: { sku: string; error: string }[] = [];

    for (const product of products) {
      const productStart = Date.now();
      try {
        const textInput = [product.name, product.category, product.brand, product.description]
          .filter(Boolean)
          .join(" | ");

        const embedding = await generateTextEmbedding(OPENAI_API_KEY, textInput);

        const { error: updateErr } = await adminClient
          .from("products")
          .update({ text_embedding: embedding })
          .eq("id", product.id);

        if (updateErr) throw updateErr;

        const elapsed = Date.now() - productStart;
        console.log(`Text embedding stored for ${product.sku} in ${elapsed}ms total`);
        processedCount++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        console.error(`Failed for ${product.sku}: ${msg}`);
        failures.push({ sku: product.sku, error: msg });
        failedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        processed_count: processedCount,
        failed_count: failedCount,
        failures,
        note: "Using OpenAI text-embedding-3-small (1536 dims). Image embedding temporarily disabled.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("backfill-embeddings error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
