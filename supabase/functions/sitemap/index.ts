import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const baseUrl = "https://ashishsarl.com";

  // Static pages
  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/products", priority: "0.9", changefreq: "daily" },
    { loc: "/blog", priority: "0.8", changefreq: "daily" },
  ];

  // Fetch products
  const { data: products } = await supabase.from("products").select("id, updated_at").order("updated_at", { ascending: false });

  // Fetch published blog posts
  const { data: blogPosts } = await supabase.from("blog_posts").select("slug, updated_at").eq("is_published", true).order("published_at", { ascending: false });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const page of staticPages) {
    xml += `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }

  if (products) {
    for (const product of products) {
      xml += `  <url>
    <loc>${baseUrl}/products/${product.id}</loc>
    <lastmod>${new Date(product.updated_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }
  }

  if (blogPosts) {
    for (const post of blogPosts) {
      xml += `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.updated_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }
  }

  xml += `</urlset>`;

  return new Response(xml, {
    headers: { ...corsHeaders, "Content-Type": "application/xml" },
  });
});
