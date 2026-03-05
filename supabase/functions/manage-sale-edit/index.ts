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

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: roleData } = await serviceClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();

  if (!roleData) {
    return jsonResponse({ error: "Forbidden: super_admin only" }, 403);
  }

  try {
    const body = await req.json();
    const { action, sale_id, reason } = body;

    if (!sale_id) return jsonResponse({ error: "sale_id is required" }, 400);
    if (!action || !["cancel", "prepare_edit"].includes(action)) {
      return jsonResponse({ error: "action must be cancel or prepare_edit" }, 400);
    }

    // Fetch sale
    const { data: sale, error: saleErr } = await serviceClient
      .from("sales")
      .select("*")
      .eq("id", sale_id)
      .single();

    if (saleErr || !sale) return jsonResponse({ error: "Sale not found" }, 404);
    if (sale.status !== "active") {
      return jsonResponse({ error: `Sale already ${sale.status}` }, 400);
    }

    // Fetch sale items
    const { data: items } = await serviceClient
      .from("sale_items")
      .select("*")
      .eq("sale_id", sale_id);

    // Build snapshot
    const previousSnapshot = { sale, items };

    if (action === "cancel") {
      // 1. Reverse stock
      await serviceClient.rpc("reverse_sale_stock", { p_sale_id: sale_id });

      // 2. Mark cancelled
      await serviceClient
        .from("sales")
        .update({ status: "cancelled" })
        .eq("id", sale_id);

      // 3. Audit log with action_type
      await serviceClient.from("sales_audit_log").insert({
        sale_id,
        action_type: "cancel",
        previous_sale_snapshot: previousSnapshot,
        new_sale_snapshot: null,
        edited_by: userId,
        reason: reason || null,
      });

      return jsonResponse({ success: true, message: "Sale cancelled and stock reversed" });
    }

    if (action === "prepare_edit") {
      // 1. Reverse stock
      await serviceClient.rpc("reverse_sale_stock", { p_sale_id: sale_id });

      // 2. Mark edited
      await serviceClient
        .from("sales")
        .update({ status: "edited" })
        .eq("id", sale_id);

      // 3. Audit log (new_sale_snapshot will be filled when the new sale is created)
      await serviceClient.from("sales_audit_log").insert({
        sale_id,
        action_type: "edit",
        previous_sale_snapshot: previousSnapshot,
        new_sale_snapshot: null,
        edited_by: userId,
        reason: reason || null,
      });

      // 4. Fetch product names for prefill
      const productIds = (items ?? []).map((i: any) => i.product_id);
      const { data: products } = await serviceClient
        .from("products")
        .select("id, name, sku, retail_price")
        .in("id", productIds);

      const productMap: Record<string, any> = {};
      products?.forEach((p: any) => (productMap[p.id] = p));

      const prefillItems = (items ?? []).map((i: any) => ({
        product_id: i.product_id,
        name: productMap[i.product_id]?.name ?? "",
        sku: productMap[i.product_id]?.sku ?? "",
        qty: i.quantity,
        rate: Number(i.selling_price),
        amount: i.quantity * Number(i.selling_price),
      }));

      return jsonResponse({
        success: true,
        old_sale_id: sale_id,
        store_id: sale.store_id,
        customer_name: sale.customer_name,
        narration: sale.narration,
        payment_method: sale.payment_method,
        items: prefillItems,
      });
    }
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
});
