import { useEffect } from "react";

interface FacebookPixelProps {
  pixelId?: string;
}

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

// Initialize Facebook Pixel
export const initFacebookPixel = (pixelId: string) => {
  if (typeof window === "undefined") return;
  if (window.fbq) return; // Already initialized

  const fbq = function (...args: any[]) {
    if (window.fbq.callMethod) {
      window.fbq.callMethod.apply(window.fbq, args);
    } else {
      window.fbq.queue.push(args);
    }
  };

  if (!window._fbq) window._fbq = fbq;
  window.fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];

  // Load the Facebook Pixel script
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  // Initialize with Pixel ID
  fbq("init", pixelId);
  fbq("track", "PageView");
};

// Track custom events
export const trackFBEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, params);
  }
};

// Track standard e-commerce events
export const trackFBViewContent = (params: {
  content_name: string;
  content_ids: string[];
  content_type: string;
  value?: number;
  currency?: string;
}) => {
  trackFBEvent("ViewContent", {
    ...params,
    currency: params.currency || "XAF",
  });
};

export const trackFBAddToCart = (params: {
  content_name: string;
  content_ids: string[];
  content_type: string;
  value: number;
  currency?: string;
}) => {
  trackFBEvent("AddToCart", {
    ...params,
    currency: params.currency || "XAF",
  });
};

export const trackFBPurchase = (params: {
  content_ids: string[];
  content_type: string;
  value: number;
  currency?: string;
  num_items?: number;
}) => {
  trackFBEvent("Purchase", {
    ...params,
    currency: params.currency || "XAF",
  });
};

export const trackFBInitiateCheckout = (params: {
  content_ids: string[];
  value: number;
  currency?: string;
  num_items?: number;
}) => {
  trackFBEvent("InitiateCheckout", {
    ...params,
    currency: params.currency || "XAF",
  });
};

// React component for easy integration
export const FacebookPixel: React.FC<FacebookPixelProps> = ({ pixelId }) => {
  useEffect(() => {
    if (pixelId) {
      initFacebookPixel(pixelId);
    }
  }, [pixelId]);

  return null;
};

export default FacebookPixel;
