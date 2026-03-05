import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
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

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { product_id, text_input, image_url } = await req.json();

    if (!product_id) {
      return new Response(JSON.stringify({ error: "product_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { text_embedding?: boolean; image_embedding?: boolean; errors: string[] } = {
      errors: [],
    };

    if (text_input) {
      try {
        const embedding = await generateTextEmbedding(OPENAI_API_KEY, text_input);

        const { error: updateErr } = await adminClient
          .from("products")
          .update({ text_embedding: embedding })
          .eq("id", product_id);

        if (updateErr) throw updateErr;
        results.text_embedding = true;
        console.log(`Text embedding stored for product ${product_id}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown text embedding error";
        console.error(`Text embedding failed for ${product_id}:`, msg);
        results.errors.push(`text_embedding: ${msg}`);
      }
    }

    // Image embedding - TEMPORARILY DISABLED
    if (image_url) {
      console.warn(`Image embedding temporarily disabled for product ${product_id}. Skipping.`);
      results.errors.push("image_embedding: temporarily disabled");
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-embeddings error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
