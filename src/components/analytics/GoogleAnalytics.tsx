import { useEffect } from "react";

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const initGA4 = (measurementId: string) => {
  if (typeof window === "undefined" || !measurementId) return;
  if (document.getElementById("ga4-script")) return; // already loaded

  // Inject gtag.js script
  const script = document.createElement("script");
  script.id = "ga4-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer + gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: any[]) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: true });
};

// Track a GA4 event
export const trackGA4Event = (
  eventName: string,
  params?: Record<string, any>
) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
};

// Standard e-commerce GA4 helpers
export const trackGA4ViewItem = (params: {
  item_id: string;
  item_name: string;
  price?: number;
  currency?: string;
}) => {
  trackGA4Event("view_item", {
    currency: params.currency ?? "XAF",
    value: params.price ?? 0,
    items: [{ item_id: params.item_id, item_name: params.item_name, price: params.price }],
  });
};

export const trackGA4AddToCart = (params: {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  currency?: string;
}) => {
  trackGA4Event("add_to_cart", {
    currency: params.currency ?? "XAF",
    value: params.price * (params.quantity ?? 1),
    items: [
      {
        item_id: params.item_id,
        item_name: params.item_name,
        price: params.price,
        quantity: params.quantity ?? 1,
      },
    ],
  });
};

export const trackGA4Purchase = (params: {
  transaction_id: string;
  value: number;
  items: { item_id: string; item_name: string; price: number; quantity: number }[];
  currency?: string;
}) => {
  trackGA4Event("purchase", {
    transaction_id: params.transaction_id,
    currency: params.currency ?? "XAF",
    value: params.value,
    items: params.items,
  });
};

export const trackGA4BeginCheckout = (params: {
  value: number;
  items: { item_id: string; item_name: string; price: number; quantity: number }[];
  currency?: string;
}) => {
  trackGA4Event("begin_checkout", {
    currency: params.currency ?? "XAF",
    value: params.value,
    items: params.items,
  });
};

interface GoogleAnalyticsProps {
  measurementId?: string | null;
}

export const GoogleAnalytics: React.FC<GoogleAnalyticsProps> = ({ measurementId }) => {
  useEffect(() => {
    if (measurementId) {
      initGA4(measurementId);
    }
  }, [measurementId]);

  return null;
};

export default GoogleAnalytics;
