import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const createProductSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required").max(100),
  name: z.string().trim().min(1, "Name is required").max(500),
  retail_price: z.number().min(0, "retail_price must be >= 0"),
  barcode: z.string().trim().max(100).nullable().optional(),
  brand: z.string().trim().max(200).optional().default(""),
  category: z.string().trim().max(200).optional().default(""),
  description: z.string().trim().max(5000).nullable().optional(),
  cost_price: z.number().min(0).optional().default(0),
  wholesale_price: z.number().min(0).optional().default(0),
  reorder_level: z.number().int().min(0).optional().default(0),
  duplicate_override_reason: z.string().trim().max(1000).nullable().optional(),
  main_image_path: z.string().trim().max(1000).nullable().optional(),
});

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
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, supabaseKey);

    // Verify user is admin
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

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // LIST products
    if (req.method === "GET" || action === "list") {
      const { data, error } = await adminClient
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ products: data, total: data.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CREATE product
    if (req.method === "POST") {
      const body = await req.json();
      const parsed = createProductSchema.safeParse(body);

      if (!parsed.success) {
        return new Response(
          JSON.stringify({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const retailPrice = parsed.data.retail_price;

      const { data, error } = await adminClient
        .from("products")
        .insert({
          sku: parsed.data.sku,
          name: parsed.data.name,
          // Keep both price columns in sync — trigger handles it,
          // but set both explicitly for safety
          price: Math.round(retailPrice),
          retail_price: retailPrice,
          barcode: parsed.data.barcode ?? null,
          brand: parsed.data.brand || "",
          category: parsed.data.category || "",
          description: parsed.data.description ?? null,
          cost_price: parsed.data.cost_price,
          wholesale_price: parsed.data.wholesale_price,
          reorder_level: parsed.data.reorder_level,
          is_active: true,
          duplicate_override_reason: parsed.data.duplicate_override_reason ?? null,
          main_image_path: parsed.data.main_image_path ?? null,
          in_stock: true,
        })
        .select("id")
        .single();

      if (error) {
        if (error.code === "23505") {
          return new Response(
            JSON.stringify({ error: "SKU already exists" }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw error;
      }

      return new Response(JSON.stringify({ id: data.id, message: "Product created" }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
