import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod schema for comprehensive input validation
const ProductSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required").max(500, "Name must be less than 500 characters"),
  name_fr: z.string().max(500).optional(),
  brand: z.string().min(1, "Brand is required").max(200, "Brand must be less than 200 characters"),
  category: z.string().min(1, "Category is required").max(200, "Category must be less than 200 characters"),
  price: z.number().int("Price must be an integer").positive("Price must be positive").max(100000000, "Price exceeds maximum"),
  original_price: z.number().int().positive().max(100000000).optional().nullable(),
  description: z.string().max(5000, "Description must be less than 5000 characters").optional().nullable(),
  description_fr: z.string().max(5000).optional().nullable(),
  features: z.array(z.string().max(500)).max(50, "Maximum 50 features allowed").optional(),
  features_fr: z.array(z.string().max(500)).max(50).optional(),
  images: z.array(z.string().url("Invalid image URL")).max(20, "Maximum 20 images allowed").optional(),
  in_stock: z.boolean().optional(),
  is_new: z.boolean().optional(),
});

const RequestSchema = z.object({
  products: z.array(ProductSchema).min(1, "At least one product required").max(1000, "Maximum 1000 products per batch"),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // First verify the user is an admin using their token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role using service client
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isAdmin, error: roleError } = await serviceClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: "Not authorized - admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = RequestSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      }));
      return new Response(JSON.stringify({ error: "Validation failed", details: errors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { products } = validationResult.data;

    // Transform products to database format
    const dbProducts = products.map((p) => ({
      name: p.name,
      name_fr: p.name_fr || p.name,
      brand: p.brand,
      category: p.category,
      price: p.price,
      original_price: p.original_price || null,
      description: p.description || null,
      description_fr: p.description_fr || p.description || null,
      features: p.features || [],
      features_fr: p.features_fr || p.features || [],
      images: p.images || [],
      in_stock: p.in_stock ?? true,
      is_new: p.is_new ?? false,
    }));

    // Insert products in batches of 100
    const batchSize = 100;
    let inserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < dbProducts.length; i += batchSize) {
      const batch = dbProducts.slice(i, i + batchSize);
      const { data, error } = await serviceClient
        .from("products")
        .insert(batch)
        .select("id");

      if (error) {
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        inserted += data?.length || 0;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted,
        total: products.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
