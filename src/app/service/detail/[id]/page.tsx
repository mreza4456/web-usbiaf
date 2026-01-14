// ============================================
// FILE: /app/service/[id]/page.tsx
// Category Detail Page dengan Cart Integration
// ============================================

"use client";
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Image,
  AlertCircle,
  ShoppingCart,
  Plus,
  Minus
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCategoriesById } from '@/action/categories';
import { getPackageCategoriesByCategoryId } from '@/action/package';
import { addToCart, getCartCount } from '@/action/cart';
import type { ICategory, IPackageCategories, IImageCategories } from '@/interface';
import { useAuthStore } from '@/store/auth';

interface CategoryDetailPageProps {
  params: Promise<{ id: string; }>;
}

interface ICategoryWithImages extends ICategory {
  images?: IImageCategories[]
}

export default function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const router = useRouter();
  const { id: categoryId } = use(params);
  const user = useAuthStore((s) => s.user);

  const [category, setCategory] = useState<ICategoryWithImages | null>(null);
  const [packages, setPackages] = useState<IPackageCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cart states
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Image gallery states
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!categoryId || categoryId === 'undefined' || categoryId === 'null') {
        setError('Invalid category ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch category
        const categoryResult = await getCategoriesById(categoryId);
        if (categoryResult.success && categoryResult.data) {
          setCategory(categoryResult.data);
        } else {
          setError(categoryResult.message || 'Failed to load category');
          setLoading(false);
          return;
        }

        // Fetch packages
        const packagesResult = await getPackageCategoriesByCategoryId(categoryId);
        if (packagesResult.success && Array.isArray(packagesResult.data)) {
          setPackages(packagesResult.data);
        } else {
          setPackages([]);
        }

        // Fetch cart count if user logged in
        if (user?.id) {
          const countResult = await getCartCount(user.id);
          if (countResult.success) {
            setCartCount(countResult.count);
          }
        }
      } catch (error) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId, user?.id]);

  const images = category?.images || [];
  const hasMultipleImages = images.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!selectedPackage) {
      setNotificationMessage('Please select a package first');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }

    setIsAddingToCart(true);
    try {
      const result = await addToCart({
        user_id: user.id,
        categories_id: categoryId,
        package_id: selectedPackage,
        quantity: quantity
      });

      if (result.success) {
        setNotificationMessage(
          result.action === 'updated'
            ? 'Cart updated successfully!'
            : 'Added to cart successfully!'
        );
        setShowNotification(true);

        // Update cart count
        const countResult = await getCartCount(user.id);
        if (countResult.success) {
          setCartCount(countResult.count);
        }

        // Reset quantity
        setQuantity(1);

        setTimeout(() => setShowNotification(false), 3000);
      } else {
        setNotificationMessage(result.message || 'Failed to add to cart');
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    } catch (err: any) {
      setNotificationMessage(err.message || 'Failed to add to cart');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } finally {
      setIsAddingToCart(false);
    }
  };


  // Atau lebih aman:
  const selectedPackageData = selectedPackage
    ? packages.find(p => p.id.toString() === selectedPackage)
    : null;
  console.log('Selected Package:', selectedPackage);
  console.log('Selected Package Data:', selectedPackageData);
  console.log('Packages:', packages);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Category Details...</p>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">{error || 'Category not found'}</p>
            <Button onClick={() => router.push('/service')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Services
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Navigation */}
        <div className="flex justify-between items-center mb-6">
          <Button
            onClick={() => router.push('/service')}
            variant="ghost"
            className="text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </Button>

          <Button
            onClick={() => router.push('/cart')}
            className="bg-purple-600 hover:bg-purple-700 text-white relative"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Button>
        </div>

        {/* Notification */}
        {showNotification && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <Alert className="bg-green-500 text-white border-green-600 shadow-lg">
              <CheckCircle2 className="w-5 h-5" />
              <AlertDescription className="font-medium">
                {notificationMessage}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Category Info Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          {images.length > 0 ? (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 aspect-[4/3]">
                <img
                  src={images[currentImageIndex]?.image_url}
                  alt={`${category.name} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=800&h=600&fit=crop";
                  }}
                />

                {hasMultipleImages && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all"
                    >
                      <ChevronLeft className="w-6 h-6 text-purple-600" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all"
                    >
                      <ChevronRight className="w-6 h-6 text-purple-600" />
                    </button>
                  </>
                )}

                <Badge className="absolute top-4 right-4 bg-purple-600 text-white">
                  {currentImageIndex + 1} / {images.length}
                </Badge>
              </div>

              {hasMultipleImages && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => goToImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === index
                          ? 'border-purple-500 ring-4 ring-purple-200'
                          : 'opacity-50 hover:opacity-100 border-transparent'
                        }`}
                    >
                      <img
                        src={image.image_url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 bg-gray-100 rounded-2xl">
              <Image className="w-16 h-16 text-gray-400" />
            </div>
          )}

          {/* Category Description */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{category.name}</h1>
              {category.description && (
                <p className="text-gray-600 text-lg">{category.description}</p>
              )}
              {category.start_price && (
                <div className="mt-4">
                  <Badge className="bg-purple-100 text-purple-700 text-lg px-4 py-2">
                    Starting From ${category.start_price}
                  </Badge>
                </div>
              )}
              
            </div>
          </div>
        </div>

        {/* Package Selection */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Choose Your Package</h2>

          {packages.length === 0 ? (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>No packages available for this service yet.</AlertDescription>
            </Alert>
          ) : (

            <div className="grid md:grid-cols-3 gap-6">
              {/* Add to Cart Section - Always Visible */}
             
              {packages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`cursor-pointer transition-all hover:shadow-xl ${selectedPackage === pkg.id.toString()
                      ? 'ring-4 ring-purple-500 shadow-xl'
                      : 'hover:ring-2 hover:ring-purple-300'
                    }`}
                  onClick={() => setSelectedPackage(pkg.id.toString())}
                >
                  <CardHeader>
                    <Badge className="w-fit mb-2 bg-purple-100 text-purple-700">
                      {pkg.package}
                    </Badge>
                    <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                    <div className="text-3xl font-bold text-purple-600 mt-2">
                      ${pkg.price}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {pkg.description && (
                      <p className="text-gray-600 mb-4">{pkg.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Add to Cart Section */}
        {selectedPackage && selectedPackageData && (
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">Add to Cart</CardTitle>
              <CardDescription>
                Selected: {selectedPackageData.package} - {selectedPackageData.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quantity</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center font-semibold"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="text-sm text-gray-600 mb-1">Subtotal</div>
                  <div className="text-2xl font-bold text-purple-600">
                    ${(selectedPackageData.price * quantity).toLocaleString()}
                  </div>
                </div>

                <Button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                >
                  {isAddingToCart ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Section */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="text-2xl">What's Included</CardTitle>
            <CardDescription>All packages include these premium features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Custom design sesuai brand",
                "2x revisi gratis",
                "Full HD & 4K ready",
                "Source files included",
                "Commercial license",
                "24/7 support"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}