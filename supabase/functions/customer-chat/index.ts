import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* ── Embedding via OpenAI ── */
async function generateEmbedding(apiKey: string, text: string): Promise<number[] | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

/* ── Product retrieval via RAG ── */
async function fetchRelevantProducts(
  supabase: any,
  userQuery: string,
  openaiKey: string | undefined
): Promise<any[]> {
  // 1. Try vector similarity search if OpenAI key is available
  if (openaiKey && userQuery.trim().length > 0) {
    const embedding = await generateEmbedding(openaiKey, userQuery);
    if (embedding) {
      const vectorStr = `[${embedding.join(",")}]`;
      const { data, error } = await supabase.rpc("search_products_by_text", {
        query_vector: vectorStr,
        search_text: userQuery,
        result_limit: 15,
      });
      if (!error && data && data.length > 0) {
        console.log(`RAG: vector search returned ${data.length} products`);
        return data;
      }
    }
  }

  // 2. Fallback: keyword search — extract meaningful words from user query
  const words = userQuery
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 5);

  if (words.length > 0) {
    const orFilters = words.flatMap((w) => [
      `name.ilike.%${w}%`,
      `description.ilike.%${w}%`,
      `brand.ilike.%${w}%`,
      `category.ilike.%${w}%`,
    ]);

    const { data } = await supabase
      .from("products")
      .select(
        "id, name, name_fr, brand, category, description, description_fr, price, retail_price, original_price, in_stock, is_new"
      )
      .eq("is_active", true)
      .or(orFilters.join(","))
      .limit(15);

    if (data && data.length > 0) {
      console.log(`RAG: keyword search returned ${data.length} products`);
      return data;
    }
  }

  // 3. Last resort: return a limited catalog sample (max 50)
  const { data } = await supabase
    .from("products")
    .select(
      "id, name, name_fr, brand, category, description, description_fr, price, retail_price, original_price, in_stock, is_new"
    )
    .eq("is_active", true)
    .order("category")
    .order("name")
    .limit(50);

  console.log(`RAG: catalog fallback returned ${data?.length ?? 0} products`);
  return data ?? [];
}

/* ── System prompt builder ── */
const buildSystemPrompt = (products: any[], language: string, userQuery: string) => {
  const productsByCategory: Record<string, any[]> = {};
  products.forEach((p) => {
    const cat = p.category ?? "General";
    if (!productsByCategory[cat]) productsByCategory[cat] = [];
    productsByCategory[cat].push(p);
  });

  let catalogSummary = "";
  for (const [category, items] of Object.entries(productsByCategory)) {
    catalogSummary += `\n## ${category} (${items.length} products)\n`;
    items.forEach((p) => {
      const name = language === "fr" && p.name_fr ? p.name_fr : p.name;
      const desc = language === "fr" && p.description_fr ? p.description_fr : (p.description ?? "");
      const displayPrice = Number(p.retail_price ?? p.price ?? 0);
      const origPrice = p.original_price
        ? ` ~~${Number(p.original_price).toLocaleString()} FCFA~~`
        : "";
      const discount = p.original_price
        ? ` (${Math.round((1 - displayPrice / Number(p.original_price)) * 100)}% off)`
        : "";
      const stock = p.in_stock ? "In Stock" : "Out of Stock";
      const newBadge = p.is_new ? " [NEW]" : "";
      catalogSummary += `- **${name}**${newBadge} by ${p.brand ?? "?"}: ${displayPrice.toLocaleString()} FCFA${origPrice}${discount} | ${stock}\n`;
      if (desc) catalogSummary += `  ${desc.substring(0, 100)}${desc.length > 100 ? "…" : ""}\n`;
    });
  }

  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort().join(", ");

  return `You are Ashishi, the friendly mascot assistant for Ashish SARL, a premium home furnishing and electronics store in Cameroon.

## Your Personality
- Warm, helpful, and passionate about helping customers find what they need
- You speak like a friendly shopping companion, not a robot
- You use occasional emojis (but not too many)

## Your Capabilities
1. Product recommendations based on customer needs and budget
2. Budget filtering — help customers find products within their budget
3. Product comparison — compare features, prices, value
4. Deal hunting — highlight sale items or best-value products

## How to Help
- When a customer mentions a budget, immediately filter and suggest suitable products
- When comparing, create a clear side-by-side comparison
- Mention prices, discounts, and stock status
- If out of stock, suggest similar alternatives
- Ask follow-up questions to better understand needs

## Store Information
- **Location**: Cameroon
- **Currency**: FCFA (Central African CFA franc)
- **Payment**: Cash on Delivery, Orange Money, MTN Mobile Money
- **Contact**: +237 673750693
- **Brands available**: ${brands || "Various"}

## Current Catalog (pre-filtered to be most relevant to this conversation)
${catalogSummary || "No products currently loaded."}

## Response Guidelines
- Be warm, helpful, conversational — you're Ashishi, their shopping friend!
- Respond in the same language the customer uses (English or French)
- Use product names and prices from the catalog above only
- For complaints, returns, or urgent matters: "For this, I'd recommend speaking directly with our team! 📞 +237 673750693"
- End responses with helpful follow-up questions when appropriate`;
};

/* ── Main handler ── */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = "en" } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase credentials not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Extract last user message as the RAG query
    const userMessages = (messages as any[]).filter((m: any) => m.role === "user");
    const lastUserMsg: string =
      userMessages.length > 0 ? String(userMessages[userMessages.length - 1].content ?? "") : "";

    // Retrieve relevant products via RAG
    const products = await fetchRelevantProducts(supabase, lastUserMsg, OPENAI_API_KEY);
    const systemPrompt = buildSystemPrompt(products, language, lastUserMsg);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Customer chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
