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

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === "," || ch === ";") {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
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
    const { csv_content } = body;

    if (!csv_content || typeof csv_content !== "string") {
      return jsonResponse({ error: "csv_content is required as a string" }, 400);
    }

    const lines = csv_content.split(/\r?\n/).filter((l: string) => l.trim());
    if (lines.length < 2) {
      return jsonResponse({ error: "CSV must have a header row and at least one data row" }, 400);
    }

    const headerLine = lines[0].toLowerCase();
    const headers = parseCsvLine(headerLine);

    const requiredFields = ["sku", "name", "category", "cost_price", "retail_price"];
    for (const field of requiredFields) {
      if (!headers.includes(field)) {
        return jsonResponse({ error: `Missing required CSV column: ${field}` }, 400);
      }
    }

    const colIndex: Record<string, number> = {};
    headers.forEach((h, i) => { colIndex[h] = i; });

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const toUpsert: any[] = [];
    const errors: string[] = [];
    const seenSkus = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      const get = (field: string) => values[colIndex[field]] ?? "";

      const sku = get("sku");
      const name = get("name");
      const category = get("category");
      const costPrice = parseFloat(get("cost_price"));
      const retailPrice = parseFloat(get("retail_price"));
      const wholesalePrice = parseFloat(get("wholesale_price") || "0");
      const brand = get("brand") || "Generic";
      const description = get("description") || null;
      const barcode = get("barcode") || null;

      // Validate
      if (!sku || !name || !category) {
        errors.push(`Row ${i + 1}: sku, name, and category are required`);
        continue;
      }

      if (isNaN(costPrice) || costPrice < 0) {
        errors.push(`Row ${i + 1}: cost_price must be >= 0`);
        continue;
      }

      if (isNaN(retailPrice) || retailPrice < 0) {
        errors.push(`Row ${i + 1}: retail_price must be >= 0`);
        continue;
      }

      // Skip duplicates within the same CSV (keep first occurrence)
      if (seenSkus.has(sku.toLowerCase())) {
        errors.push(`Row ${i + 1}: duplicate SKU "${sku}" in CSV — first occurrence used`);
        continue;
      }
      seenSkus.add(sku.toLowerCase());

      toUpsert.push({
        sku,
        name,
        category,
        cost_price: costPrice,
        retail_price: retailPrice,
        price: Math.round(retailPrice),   // ecommerce INTEGER column kept in sync
        wholesale_price: isNaN(wholesalePrice) ? 0 : wholesalePrice,
        brand,
        description,
        barcode,
        is_active: true,
        in_stock: true,
      });
    }

    let upserted = 0;
    if (toUpsert.length > 0) {
      // Upsert in batches of 100 — existing SKUs are updated, new ones inserted
      for (let i = 0; i < toUpsert.length; i += 100) {
        const batch = toUpsert.slice(i, i + 100);
        const { error: upsertError, data: upsertedData } = await serviceClient
          .from("products")
          .upsert(batch, { onConflict: "sku", ignoreDuplicates: false })
          .select("id");

        if (upsertError) {
          return jsonResponse({ error: `Upsert failed: ${upsertError.message}` }, 400);
        }
        upserted += upsertedData?.length ?? 0;
      }
    }

    return jsonResponse({
      total_upserted: upserted,
      total_rows_parsed: lines.length - 1,
      validation_errors: errors,
    });
  } catch (e) {
    return jsonResponse({ error: e.message }, 500);
  }
});
