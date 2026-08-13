import { createClient } from "@/config/supabase-server";

// NOTE: this file intentionally has NO "use server" directive. It's a
// server-only helper module imported by actual Server Action files
// (actions/paypal.ts, actions/checkout.ts) — it is never called directly
// from a client component. Files with "use server" may only export async
// functions, so shared types/interfaces live here instead.

export interface VerifiedCartItem {
  cart_id: string;
  package_id: string;
  quantity: number;
  unit_price: number;
  item_total: number;
}

export interface VerifiedTotal {
  items: VerifiedCartItem[];
  subtotal: number;
  discount: number;
  total: number;
}

// ============================================
// SECURITY: single source of truth for "how much does this cart cost".
// Recomputes everything from the database — cart ownership, unit prices,
// and voucher validity/discount — instead of trusting anything the client
// sends. Both PayPal order creation (actions/paypal.ts) and final order
// persistence (actions/checkout.ts) call this same function so the number
// PayPal charges and the number saved to `orders.total` can never drift
// apart or be manipulated independently.
//
// ASUMSI: sesuaikan nama kolom di bawah ini dengan skema tabel `carts` dan
// `categories_package` kamu yang sebenarnya. Yang penting HARGA diambil
// dari `categories_package` (server), BUKAN dari `price`/`total` yang
// dikirim client.
export async function computeVerifiedTotal(
  userId: string,
  cartIds: string[],
  voucherId?: string
): Promise<VerifiedTotal> {
  const supabase = await createClient();

  // 1. Ambil cart items milik user ini saja (sekaligus verifikasi ownership)
  const { data: carts, error: cartError } = await supabase
    .from("carts")
    .select("id, quantity, package_id") // ASUMSI: kolom quantity & package_id ada di tabel carts
    .eq("user_id", userId)
    .in("id", cartIds);

  if (cartError) {
    console.error("❌ Cart fetch error:", cartError);
    throw new Error("Failed to load cart items");
  }

  if (!carts || carts.length !== cartIds.length) {
    throw new Error("Some cart items are no longer available or do not belong to you");
  }

  // 2. Ambil harga resmi dari categories_package (JANGAN percaya harga dari client)
  const packageIds = [...new Set(carts.map((c) => c.package_id))];
  const { data: packages, error: packageError } = await supabase
    .from("categories_package")
    .select("id, price") // ASUMSI: kolom price ada di categories_package
    .in("id", packageIds);

  if (packageError || !packages) {
    console.error("❌ Package fetch error:", packageError);
    throw new Error("Failed to load package prices");
  }

  const priceMap = new Map(packages.map((p) => [p.id, Number(p.price)]));

  const items: VerifiedCartItem[] = carts.map((c) => {
    const unit_price = priceMap.get(c.package_id) ?? 0;
    const quantity = c.quantity ?? 1;
    return {
      cart_id: c.id,
      package_id: c.package_id,
      quantity,
      unit_price,
      item_total: unit_price * quantity,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.item_total, 0);

  // 3. Terapkan voucher (logika sama seperti calculateDiscount di checkout-page.tsx)
  let discount = 0;

  if (voucherId) {
    const { data: voucher, error: voucherError } = await supabase
      .from("vouchers")
      .select("id, value, is_used, expired_at, user_id")
      .eq("id", voucherId)
      .single();

    if (voucherError || !voucher) {
      throw new Error("Voucher not found");
    }
    if (voucher.user_id !== userId) {
      throw new Error("This voucher does not belong to you");
    }
    if (voucher.is_used) {
      throw new Error("Voucher has already been used");
    }
    if (new Date() > new Date(voucher.expired_at)) {
      throw new Error("Voucher has expired");
    }

    const voucherValue = String(voucher.value);
    const percentageMatch = voucherValue.match(/(\d+)%/);

    if (percentageMatch) {
      const percentage = parseInt(percentageMatch[1]);
      discount = (subtotal * percentage) / 100;
    } else {
      const nominalValue = parseFloat(voucherValue.replace(/[^\d.]/g, ""));
      discount = isNaN(nominalValue) ? 0 : nominalValue;
    }
  }

  const total = Math.max(subtotal - discount, 0);

  return { items, subtotal, discount, total };
}