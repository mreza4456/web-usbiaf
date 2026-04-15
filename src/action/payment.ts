"use server";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export const getStripeClientSecret = async (amountInUsd: number) => {
  try {
    console.log("📩 Received amount (USD):", amountInUsd);

    // Stripe butuh dalam cents (integer)
    const amountInCents = Math.round(amountInUsd * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      description: "Payment for Our Services",
      automatic_payment_methods: { enabled: true },
    });

    console.log("✅ PaymentIntent created:", paymentIntent.id);

    return {
      success: true,
      data: paymentIntent.client_secret,
    };
  } catch (error: any) {
    console.error("❌ Stripe error:", error.message);
    return {
      success: false,
      message: error.message,
    };
  }
};