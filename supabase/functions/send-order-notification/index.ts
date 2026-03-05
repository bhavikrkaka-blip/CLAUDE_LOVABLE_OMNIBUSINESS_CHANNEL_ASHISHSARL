import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Zod schema for comprehensive input validation
const OrderNotificationSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  customerName: z.string().min(1, "Customer name required").max(200, "Customer name too long"),
  orderId: z.string().uuid("Invalid order ID format"),
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"], {
    errorMap: () => ({ message: "Invalid order status" }),
  }),
  orderTotal: z.number().int().positive().max(1000000000).optional(),
});

// Sanitize string to prevent XSS in HTML emails
const sanitizeForHtml = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const getStatusMessage = (status: string) => {
  switch (status) {
    case "confirmed":
      return {
        subject: "Your Order Has Been Confirmed! 🎉",
        title: "Great News!",
        message: "Your order has been confirmed and is being prepared for delivery.",
        color: "#22c55e",
      };
    case "processing":
      return {
        subject: "Your Order is Being Processed 📦",
        title: "Order Processing",
        message: "Your order is now being processed and will be shipped soon.",
        color: "#3b82f6",
      };
    case "cancelled":
      return {
        subject: "Order Cancelled",
        title: "Order Cancelled",
        message: "Unfortunately, your order has been cancelled. Please contact us for more information.",
        color: "#ef4444",
      };
    case "shipped":
      return {
        subject: "Your Order is On the Way! 🚚",
        title: "Order Shipped!",
        message: "Your order has been shipped and is on its way to you. You will receive it soon!",
        color: "#3b82f6",
      };
    case "delivered":
      return {
        subject: "Order Delivered! ✅",
        title: "Order Complete",
        message: "Your order has been delivered. Thank you for shopping with us!",
        color: "#22c55e",
      };
    default:
      return {
        subject: "Order Status Update",
        title: "Order Update",
        message: `Your order status has been updated to: ${status}`,
        color: "#6b7280",
      };
  }
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the JWT and get user claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = claimsData.claims.sub;

    // Verify the user is an admin
    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = OrderNotificationSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      }));
      return new Response(
        JSON.stringify({ error: "Validation failed", details: errors }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, customerName, orderId, status, orderTotal } = validationResult.data;

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Validate that the order exists
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const statusInfo = getStatusMessage(status);
    
    // Sanitize customer name for safe HTML rendering
    const safeCustomerName = sanitizeForHtml(customerName);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Elystore <onboarding@resend.dev>",
        to: [email],
        subject: statusInfo.subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333; margin: 0;">Elystore</h1>
              </div>
              
              <div style="background-color: ${statusInfo.color}; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
                <h2 style="margin: 0; font-size: 24px;">${statusInfo.title}</h2>
              </div>
              
              <p style="color: #333; font-size: 16px;">Dear ${safeCustomerName},</p>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                ${statusInfo.message}
              </p>
              
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #666;"><strong>Order ID:</strong> ${orderId.slice(0, 8)}...</p>
                ${orderTotal ? `<p style="margin: 10px 0 0 0; color: #666;"><strong>Order Total:</strong> ${formatPrice(orderTotal)}</p>` : ""}
              </div>
              
              <p style="color: #666; font-size: 14px;">
                If you have any questions about your order, please don't hesitate to contact us.
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #999; font-size: 12px; text-align: center;">
                Thank you for shopping with Elystore!<br>
                © ${new Date().getFullYear()} Elystore. All rights reserved.
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailResponse = await res.json();

    if (!res.ok) {
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Order notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-order-notification function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
