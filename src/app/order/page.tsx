// app/checkout/page.tsx
"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CheckoutPage from '@/components/order-form';
import { getCartItems } from '@/action/cart';
import { processCheckout } from '@/action/order';
import { useAuthStore } from '@/store/auth';
import type { ICartItemDetail } from '@/interface';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div>login Firts</div>
    ) // Will redirect in useEffect
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