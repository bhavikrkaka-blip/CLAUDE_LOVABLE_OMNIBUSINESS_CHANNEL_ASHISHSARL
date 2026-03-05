import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef } from "react";

// Session ID management
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem("visitor_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("visitor_session_id", sessionId);
  }
  return sessionId;
};

// Device detection
const getDeviceType = (): string => {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
};

// UTM parameter extraction
const getUTMParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || null,
    utm_medium: params.get("utm_medium") || null,
    utm_campaign: params.get("utm_campaign") || null,
    utm_content: params.get("utm_content") || null,
  };
};

// Source detection
const getTrafficSource = (): string => {
  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer;
  
  // Check UTM first
  if (params.get("utm_source")) {
    const source = params.get("utm_source")!.toLowerCase();
    if (source.includes("facebook") || source.includes("fb")) return "facebook";
    if (source.includes("google")) return "google";
    if (source.includes("instagram") || source.includes("ig")) return "instagram";
    return "utm";
  }
  
  // Check referrer
  if (referrer) {
    if (referrer.includes("google")) return "google";
    if (referrer.includes("facebook") || referrer.includes("fb.com")) return "facebook";
    if (referrer.includes("instagram")) return "instagram";
    if (referrer.includes("bing")) return "bing";
    return "referral";
  }
  
  return "direct";
};

// Browser detection
const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  let os = "Unknown";

  // Browser detection
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

  // OS detection
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return { browser, os };
};

// Track click event
export const useTrackClick = () => {
  return useMutation({
    mutationFn: async ({
      elementId,
      elementType,
      elementLabel,
    }: {
      elementId: string;
      elementType: string;
      elementLabel?: string;
    }) => {
      const utmParams = getUTMParams();
      
      const { error } = await supabase.from("click_events").insert({
        element_id: elementId,
        element_type: elementType,
        element_label: elementLabel || null,
        page_path: window.location.pathname,
        session_id: getSessionId(),
        device_type: getDeviceType(),
        source: getTrafficSource(),
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium,
        utm_campaign: utmParams.utm_campaign,
        utm_content: utmParams.utm_content,
        referrer: document.referrer || null,
      });

      if (error) console.error("Click tracking error:", error);
    },
  });
};

// Initialize visitor session
export const useInitSession = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initSession = async () => {
      const sessionId = getSessionId();
      const utmParams = getUTMParams();
      const { browser, os } = getBrowserInfo();

      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;

      // Try to find existing session first
      const { data: existing } = await supabase
        .from("visitor_sessions")
        .select("id, page_views, user_id")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (existing) {
        // Only update if authenticated (RLS now requires user_id match or admin)
        // For anonymous visitors, we just track the initial session creation
        if (userId) {
          await supabase
            .from("visitor_sessions")
            .update({
              last_activity_at: new Date().toISOString(),
              page_views: (existing.page_views || 0) + 1,
              user_id: userId, // Link session to user when they log in
            })
            .eq("id", existing.id);
        }
        // Anonymous users can't update sessions - this is intentional for security
      } else {
        // Create new session - INSERT is still allowed for anyone
        await supabase.from("visitor_sessions").insert({
          session_id: sessionId,
          device_type: getDeviceType(),
          browser,
          os,
          source: getTrafficSource(),
          utm_source: utmParams.utm_source,
          utm_medium: utmParams.utm_medium,
          utm_campaign: utmParams.utm_campaign,
          utm_content: utmParams.utm_content,
          referrer: document.referrer || null,
          landing_page: window.location.pathname,
          user_id: userId, // Link to user if authenticated
        });
      }
    };

    initSession();
  }, []);
};

// Admin Analytics Hooks
export const useClickAnalytics = (days: number = 30) => {
  return useQuery({
    queryKey: ["click-analytics", days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("click_events")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Aggregate by element
      const elementStats = (data || []).reduce((acc, click) => {
        const key = `${click.element_type}:${click.element_id}`;
        if (!acc[key]) {
          acc[key] = {
            element_id: click.element_id,
            element_type: click.element_type,
            element_label: click.element_label,
            count: 0,
            pages: new Set(),
          };
        }
        acc[key].count++;
        acc[key].pages.add(click.page_path);
        return acc;
      }, {} as Record<string, any>);

      const topElements = Object.values(elementStats)
        .map((e: any) => ({
          ...e,
          pages: Array.from(e.pages),
        }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 50);

      return {
        totalClicks: data?.length || 0,
        topElements,
        rawEvents: data?.slice(0, 100) || [],
      };
    },
  });
};

export const useVisitorAnalytics = (days: number = 30) => {
  return useQuery({
    queryKey: ["visitor-analytics", days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("visitor_sessions")
        .select("*")
        .gte("first_visit_at", startDate.toISOString());

      if (error) throw error;

      // Aggregate by source
      const bySource = (data || []).reduce((acc, session) => {
        const source = session.source || "direct";
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Aggregate by device
      const byDevice = (data || []).reduce((acc, session) => {
        const device = session.device_type || "unknown";
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Aggregate by browser
      const byBrowser = (data || []).reduce((acc, session) => {
        const browser = session.browser || "unknown";
        acc[browser] = (acc[browser] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Today's visitors
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayVisitors = (data || []).filter(
        (s) => new Date(s.first_visit_at) >= today
      ).length;

      return {
        totalVisitors: data?.length || 0,
        todayVisitors,
        bySource,
        byDevice,
        byBrowser,
        sessions: data?.slice(0, 100) || [],
      };
    },
  });
};

export const useProductAnalytics = () => {
  return useQuery({
    queryKey: ["product-analytics"],
    queryFn: async () => {
      // Get product views
      const { data: views, error: viewsError } = await supabase
        .from("product_views")
        .select("product_id, products(id, name, price, images)")
        .order("viewed_at", { ascending: false });

      if (viewsError) throw viewsError;

      // Get cart items
      const { data: cartItems, error: cartError } = await supabase
        .from("cart_items")
        .select("product_id, quantity, products(id, name, price)");

      if (cartError) throw cartError;

      // Get order items (purchased)
      const { data: orderItems, error: orderError } = await supabase
        .from("order_items")
        .select("product_id, quantity, product_name, product_price");

      if (orderError) throw orderError;

      // Get abandoned carts
      const { data: abandoned, error: abandonedError } = await supabase
        .from("cart_abandonment")
        .select("product_id, quantity, converted, products(id, name, price)")
        .eq("converted", false);

      if (abandonedError) throw abandonedError;

      // Calculate view counts
      const viewCounts = (views || []).reduce((acc, v) => {
        if (v.product_id) {
          acc[v.product_id] = (acc[v.product_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Calculate cart counts
      const cartCounts = (cartItems || []).reduce((acc, c) => {
        if (c.product_id) {
          acc[c.product_id] = (acc[c.product_id] || 0) + c.quantity;
        }
        return acc;
      }, {} as Record<string, number>);

      // Calculate purchase counts
      const purchaseCounts = (orderItems || []).reduce((acc, o) => {
        if (o.product_id) {
          acc[o.product_id] = (acc[o.product_id] || 0) + o.quantity;
        }
        return acc;
      }, {} as Record<string, number>);

      // Calculate abandoned counts
      const abandonedCounts = (abandoned || []).reduce((acc, a) => {
        if (a.product_id) {
          acc[a.product_id] = (acc[a.product_id] || 0) + a.quantity;
        }
        return acc;
      }, {} as Record<string, number>);

      // Get top viewed products
      const topViewed = Object.entries(viewCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([id, count]) => ({ productId: id, views: count }));

      // Get products with highest cart abandonment
      const topAbandoned = Object.entries(abandonedCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      return {
        viewCounts,
        cartCounts,
        purchaseCounts,
        abandonedCounts,
        topViewed,
        topAbandoned,
        totalViews: views?.length || 0,
        totalCartAdds: Object.values(cartCounts).reduce((a, b) => a + b, 0),
        totalPurchases: Object.values(purchaseCounts).reduce((a, b) => a + b, 0),
        totalAbandoned: abandoned?.length || 0,
      };
    },
  });
};

// Track cart abandonment
// Now includes user_id when authenticated for proper RLS support
export const useTrackCartAbandonment = () => {
  return useMutation({
    mutationFn: async ({
      productId,
      quantity = 1,
    }: {
      productId: string;
      quantity?: number;
    }) => {
      const sessionId = getSessionId();
      
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("cart_abandonment").insert({
        session_id: sessionId,
        product_id: productId,
        quantity,
        user_id: user?.id || null, // Link to user for RLS updates later
      });

      if (error) console.error("Cart abandonment tracking error:", error);
    },
  });
};

// Mark cart item as converted
// Note: This now requires authentication due to RLS policy changes
// Only the owner of the cart abandonment record or admins can update it
export const useMarkCartConverted = () => {
  return useMutation({
    mutationFn: async ({
      productId,
      orderId,
    }: {
      productId: string;
      orderId: string;
    }) => {
      // Get current user - required for RLS
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Anonymous users cannot mark conversions - this is handled server-side
        console.log("Cart conversion tracking skipped: user not authenticated");
        return;
      }

      const { error } = await supabase
        .from("cart_abandonment")
        .update({
          converted: true,
          converted_at: new Date().toISOString(),
          order_id: orderId,
        })
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .eq("converted", false);

      if (error) console.error("Cart conversion tracking error:", error);
    },
  });
};
