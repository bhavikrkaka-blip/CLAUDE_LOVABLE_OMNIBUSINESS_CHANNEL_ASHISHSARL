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
    const { store_id, invoice_number, sale_date, payment_method, items, customer_name, narration, old_sale_id } = body;

    // Validation
    if (!store_id) return jsonResponse({ error: "store_id is required" }, 400);
    if (!invoice_number || typeof invoice_number !== "string" || !invoice_number.trim()) {
      return jsonResponse({ error: "invoice_number is required" }, 400);
    }
    if (!sale_date) return jsonResponse({ error: "sale_date is required" }, 400);

    const validMethods = ["cash", "card", "transfer"];
    if (!payment_method || !validMethods.includes(payment_method)) {
      return jsonResponse({ error: "payment_method must be cash, card, or transfer" }, 400);
    }

    if (!Array.isArray(items) || items.length === 0) {
      return jsonResponse({ error: "items array must not be empty" }, 400);
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product_id) return jsonResponse({ error: `items[${i}].product_id is required` }, 400);
      if (typeof item.quantity !== "number" || item.quantity <= 0) {
        return jsonResponse({ error: `items[${i}].quantity must be > 0` }, 400);
      }
      if (typeof item.selling_price !== "number" || item.selling_price < 0) {
        return jsonResponse({ error: `items[${i}].selling_price must be >= 0` }, 400);
      }
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await serviceClient.rpc("process_sale", {
      p_store_id: store_id,
      p_invoice_number: invoice_number.trim(),
      p_sale_date: sale_date,
      p_payment_method: payment_method,
      p_items: items,
    });

    if (error) {
      return jsonResponse({ error: error.message }, 400);
    }

    const saleId = data?.sale_id;
    if (saleId) {
      const updateFields: Record<string, string> = {};
      if (customer_name && typeof customer_name === "string" && customer_name.trim()) {
        updateFields.customer_name = customer_name.trim();
      }
      if (narration && typeof narration === "string" && narration.trim()) {
        updateFields.narration = narration.trim();
      }
      if (Object.keys(updateFields).length > 0) {
        await serviceClient.from("sales").update(updateFields).eq("id", saleId);
      }

      // Link old sale if editing
      if (old_sale_id && typeof old_sale_id === "string") {
        await serviceClient
          .from("sales")
          .update({ replaced_by_sale_id: saleId })
          .eq("id", old_sale_id);

        // Fetch the new sale + items for the audit log new_sale_snapshot
        const [{ data: newSale }, { data: newItems }] = await Promise.all([
          serviceClient.from("sales").select("*").eq("id", saleId).single(),
          serviceClient.from("sale_items").select("*").eq("sale_id", saleId),
        ]);

        // Update the existing edit audit log entry with the new_sale_snapshot
        await serviceClient
          .from("sales_audit_log")
          .update({ new_sale_snapshot: { sale: newSale, items: newItems } })
          .eq("sale_id", old_sale_id)
          .eq("action_type", "edit")
          .is("new_sale_snapshot", null);
      } else {
        // New sale creation — log audit with action_type = "create"
        const [{ data: newSale }, { data: newItems }] = await Promise.all([
          serviceClient.from("sales").select("*").eq("id", saleId).single(),
          serviceClient.from("sale_items").select("*").eq("sale_id", saleId),
        ]);

        await serviceClient.from("sales_audit_log").insert({
          sale_id: saleId,
          action_type: "create",
          previous_sale_snapshot: null,
          new_sale_snapshot: { sale: newSale, items: newItems },
          edited_by: userId,
        });
      }
    }

    return jsonResponse(data, 201);
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
});
