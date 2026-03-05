const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// IndexNow API key - a unique key for your site
const INDEXNOW_KEY = "ashishsarl2024indexnow";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls } = await req.json();
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ error: "urls array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const host = "ashishsarl.com";

    // Ping IndexNow (Bing, Yandex, etc.)
    const indexNowPayload = {
      host,
      key: INDEXNOW_KEY,
      keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`,
      urlList: urls.map((u: string) => `https://${host}${u}`),
    };

    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(indexNowPayload),
    });

    console.log("IndexNow response:", response.status);

    return new Response(JSON.stringify({ 
      success: true, 
      status: response.status,
      submitted: urls.length 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("IndexNow error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
