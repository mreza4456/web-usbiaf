// app/checkout/page.tsx
"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CheckoutPage from '@/components/order-form';
import { getCartItems } from '@/action/cart';
import { processCheckout } from '@/action/order';
import { useAuthStore } from '@/store/auth';
import type { ICartItemDetail } from '@/interface';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CheckoutSkeleton } from '@/components/skeleton-card';

export default function CheckoutPageWrapper() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.loading);
  const [cartItems, setCartItems] = useState<ICartItemDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCart() {
      // Wait for auth to be ready
      if (isLoading) return;

      if (!user?.id) {
        router.push('/login');
        return;
      }

      try {
        const result = await getCartItems(user.id);
        if (result.success && result.data) {
          // Check if cart is empty
          if (result.data.length === 0) {
            // Redirect to cart if empty
            router.push('/cart');
            return;
          }
          setCartItems(result.data);
        } else {
          setCartItems([]);
          setError('Failed to load cart items');
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        setCartItems([]);
        setError('Failed to load cart');
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, [user, isLoading, router]);

  const handleSubmitCheckout = async (checkoutData: any) => {
    try {
      if (!user?.id) {
        return { success: false, message: 'User not authenticated' };
      }

      // Process checkout - this will automatically clear cart on success
      const result = await processCheckout(checkoutData);
      
      if (result.success) {
        // Clear local cart state immediately for optimistic UI
        setCartItems([]);
        
        // Log success
        console.log(`✅ Order created: ${result.order_ref}`);
        console.log(`✅ Cart cleared: ${result.cleared_items} items removed`);
      }
      
      return result;
      
    } catch (error: any) {
      console.error('Checkout error:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to process checkout' 
      };
    }
  };

  // Loading state
  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
       <CheckoutSkeleton/>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
   return (
      <div className="min-h-screen bg-background p-4 sm:p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="text-center p-8">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">Please login to view your cart and continue shopping</p>
            <Button
              onClick={() => {
                const currentPath = window.location.pathname;
                router.push(`/auth/login`);
              }}
              size="lg"
              className="bg-primary text-white w-full"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Login Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">{error}</h2>
          <button
            onClick={() => router.push('/cart')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <CheckoutPage
      cartItems={cartItems}
      userId={user.id}
      onSubmitCheckout={handleSubmitCheckout}
    />
  );
}