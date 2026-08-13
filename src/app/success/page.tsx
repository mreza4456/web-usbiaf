import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthenticatedUser } from '@/config/supabase-server';
import { getOrderWithItems } from '@/action/order'; // sesuaikan path
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, MessageSquare, Package, Tag } from 'lucide-react';

interface CheckoutSuccessPageProps {
  searchParams: Promise<{ order_id?: string }>;
}

// SECURITY: this page is only reachable if an order with this id actually
// exists AND belongs to the currently logged-in user. Since processCheckout
// only ever inserts a row into `orders` AFTER verifying the PayPal payment
// server-side (see actions/checkout.ts + actions/paypal.ts), the mere
// existence of the order here is proof the payment went through — there's
// no separate "is this paid" flag to fake, because an unpaid checkout never
// makes it into the database at all.
//
// Nobody can land here just by typing/guessing a URL: without a real,
// owned order_id, getOrderWithItems fails and we redirect away before
// rendering anything.
export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const { order_id: orderId } = await searchParams;

  if (!orderId) {
    redirect('/cart');
  }

  let user;
  try {
    user = await getAuthenticatedUser();
  } catch {
    redirect('/login');
  }

  const result = await getOrderWithItems(orderId, user.id);

  if (!result.success || !result.data) {
    // Either the order doesn't exist, isn't paid/created yet, or doesn't
    // belong to this user — don't reveal which, just bounce them out.
    redirect('/cart');
  }

  const order = result.data as any;

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 mt-15 sm:mt-15 flex items-start justify-center">
      <div className="max-w-2xl w-full">
        <Card className="bg-white overflow-hidden border-2 shadow-lg">
          <CardContent className="p-6 sm:p-10 text-center space-y-6">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Order Placed!
              </h1>
              <p className="text-gray-600">
                We will contact you shortly to discuss your project.
              </p>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order Code</span>
                <span className="font-semibold">{order.code_order}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status</span>
                <span className="font-semibold capitalize">{order.status}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-primary/10">
                <span>Total Paid</span>
                <span className="text-primary">
                  ${Number(order.total).toLocaleString()}
                </span>
              </div>
            </div>

            {Array.isArray(order.order_items) && order.order_items.length > 0 && (
              <div className="text-left">
                <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Items
                </h2>
                <div className="space-y-2">
                  {order.order_items.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start p-3 bg-gray-50 rounded-lg border text-sm"
                    >
                      <div>
                        <p className="font-medium">{item.category_name}</p>
                        <p className="text-gray-500">
                          {item.package_title} · Qty {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        ${Number(item.total).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.vouchers && (
              <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                <Tag className="w-4 h-4" />
                Voucher {order.vouchers.code} applied
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pt-2">
              <MessageSquare className="w-4 h-4" />
              Questions about your order? Reach out via Discord: {order.discord}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild variant="outline" className="flex-1 cursor-pointer">
                <Link href="/user/user-order">View My Orders</Link>
              </Button>
              <Button asChild className="flex-1 bg-primary hover:bg-primary/90 cursor-pointer">
                <Link href="/service">Back to Commision</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}