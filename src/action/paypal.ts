"use server";

import { getAuthenticatedUser } from "@/config/supabase-server";
import { computeVerifiedTotal } from "./pricing";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;

// Sandbox by default. Set PAYPAL_ENV=live in production.
const PAYPAL_BASE_URL =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken() {
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("❌ PayPal auth error:", errText);
    throw new Error("Failed to authenticate with PayPal");
  }

  const data = await res.json();
  return data.access_token as string;
}

// computeVerifiedTotal now lives in ./pricing so both this file and
// actions/checkout.ts share the exact same server-side price/voucher logic.

// ============================================
// Replaces getStripeClientSecret. Instead of taking a client-supplied
// amount, it takes the cart ids (+ optional voucher) and recomputes the
// total server-side before creating the PayPal order.
export const createPayPalOrder = async (
  cartIds: string[],
  voucherId?: string
) => {
  try {
    const user = await getAuthenticatedUser();

    if (!cartIds || cartIds.length === 0) {
      return { success: false, message: "Cart is empty" };
    }

    const { total } = await computeVerifiedTotal(user.id, cartIds, voucherId);

    if (total <= 0) {
      return { success: false, message: "Invalid order total" };
    }

    console.log("📩 Verified server-side total (USD):", total);

    const formattedAmount = total.toFixed(2);
    const accessToken = await getPayPalAccessToken();

    const orderRes = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: formattedAmount,
            },
            description: "Payment for Our Services",
          },
        ],
      }),
      cache: "no-store",
    });

    const order = await orderRes.json();

    if (!orderRes.ok) {
      console.error("❌ PayPal create order error:", order);
      return {
        success: false,
        message: order?.message || "Failed to create PayPal order",
      };
    }

    console.log("✅ PayPal order created:", order.id);

    return {
      success: true,
      data: order.id as string,
    };
  } catch (error: any) {
    console.error("❌ PayPal error:", error.message);
    return {
      success: false,
      message: error.message,
    };
  }
};

// ============================================
// Called after the buyer approves the payment in the PayPal popup/redirect.
// Actually takes the funds.
export const capturePayPalOrder = async (paypalOrderId: string) => {
  try {
    await getAuthenticatedUser(); // require login, avoid anonymous capture calls

    console.log("📩 Capturing PayPal order:", paypalOrderId);

    const accessToken = await getPayPalAccessToken();

    const captureRes = await fetch(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const captureData = await captureRes.json();

    if (!captureRes.ok) {
      console.error("❌ PayPal capture error:", captureData);
      return {
        success: false,
        message: captureData?.message || "Failed to capture PayPal payment",
      };
    }

    const status = captureData.status;
    const captureId =
      captureData?.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;

    if (status !== "COMPLETED") {
      console.error("❌ PayPal capture not completed:", status);
      return {
        success: false,
        message: `Payment not completed (status: ${status})`,
      };
    }

    console.log("✅ PayPal payment captured:", captureId);

    return {
      success: true,
      data: {
        paypal_order_id: paypalOrderId,
        capture_id: captureId,
        status,
      },
    };
  } catch (error: any) {
    console.error("❌ PayPal error:", error.message);
    return {
      success: false,
      message: error.message,
    };
  }
};

// ============================================
// SECURITY: called from processCheckout (checkout.ts) before an order is
// persisted. Re-fetches the order straight from PayPal's servers so a
// forged payment_id sent by the client can never slip through — this is
// the actual source of truth, not anything the browser reports.
export const verifyPayPalOrder = async (paypalOrderId: string) => {
  try {
    const accessToken = await getPayPalAccessToken();

    const res = await fetch(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${paypalOrderId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ PayPal verify order error:", data);
      return { success: false, message: "Failed to verify PayPal order" };
    }

    const status = data.status as string;
    const amountValue = Number(
      data?.purchase_units?.[0]?.amount?.value ?? NaN
    );
    const captureId =
      data?.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;

    return {
      success: true,
      data: {
        status,
        amount: amountValue,
        captureId,
      },
    };
  } catch (error: any) {
    console.error("❌ PayPal error:", error.message);
    return { success: false, message: error.message };
  }
};