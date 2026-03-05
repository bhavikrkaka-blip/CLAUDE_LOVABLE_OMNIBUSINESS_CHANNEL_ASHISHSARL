import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const userId = claimsData.claims.sub;

  // Admin check
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) {
    return jsonResponse({ error: "Forbidden: admin only" }, 403);
  }

  try {
    const body = await req.json();
    const { supplier_id, invoice_number, purchase_date, items } = body;

    // Validation
    if (!supplier_id) return jsonResponse({ error: "supplier_id is required" }, 400);
    if (!invoice_number || typeof invoice_number !== "string" || !invoice_number.trim()) {
      return jsonResponse({ error: "invoice_number is required" }, 400);
    }
    if (!purchase_date) return jsonResponse({ error: "purchase_date is required" }, 400);
    if (!Array.isArray(items) || items.length === 0) {
      return jsonResponse({ error: "items array must not be empty" }, 400);
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product_id) return jsonResponse({ error: `items[${i}].product_id is required` }, 400);
      if (typeof item.quantity !== "number" || item.quantity <= 0) {
        return jsonResponse({ error: `items[${i}].quantity must be > 0` }, 400);
      }
      if (typeof item.cost_per_unit !== "number" || item.cost_per_unit < 0) {
        return jsonResponse({ error: `items[${i}].cost_per_unit must be >= 0` }, 400);
      }
    }

    // Find warehouse
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: warehouse } = await serviceClient
      .from("locations")
      .select("id")
      .eq("type", "warehouse")
      .limit(1)
      .single();

    if (!warehouse) {
      return jsonResponse({ error: "No warehouse location found" }, 400);
    }

    // Call transactional DB function
    const { data, error } = await serviceClient.rpc("process_purchase", {
      p_supplier_id: supplier_id,
      p_invoice_number: invoice_number.trim(),
      p_purchase_date: purchase_date,
      p_items: items,
      p_warehouse_id: warehouse.id,
    });

    if (error) {
      return jsonResponse({ error: error.message }, 400);
    }

    return jsonResponse(data, 201);
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
});
