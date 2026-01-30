"use client";
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Image,
  AlertCircle,
  ShoppingCart,
  Package,
  X,
  ArrowRight
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCategoriesById } from '@/action/categories';
import { getPackageCategoriesByCategoryId } from '@/action/package';
import { addToCart, getCartCount } from '@/action/cart';
import type { ICategory, IPackageCategories, IImageCategories } from '@/interface';
import { useAuthStore } from '@/store/auth';
import { Spinner } from '@/components/ui/spinner';
import { SkeletonServiceDetail } from '@/components/skeleton-card';
import CategoryCarousel from '@/components/carousel-categories';

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
  const [cartCount, setCartCount] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Image gallery states
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

        const categoryResult = await getCategoriesById(categoryId);
        if (categoryResult.success && categoryResult.data) {
          setCategory(categoryResult.data);
        } else {
          setError(categoryResult.message || 'Failed to load category');
          setLoading(false);
          return;
        }

        const packagesResult = await getPackageCategoriesByCategoryId(categoryId);
        if (packagesResult.success && Array.isArray(packagesResult.data)) {
          setPackages(packagesResult.data);
        } else {
          setPackages([]);
        }

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

  // Prevent body scroll when modal is open (only on desktop)
  useEffect(() => {
    if (isModalOpen && !isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, isMobile]);

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

  const handleAddToCart = async (packageId: string) => {
    if (!user) {
      setIsModalOpen(false);
      router.push('/auth/login');
      return;
    }

    setSelectedPackage(packageId);
    setIsAddingToCart(true);

    try {
      const result = await addToCart({
        user_id: user.id,
        categories_id: categoryId,
        package_id: packageId,
        quantity: 1
      });

      if (result.success) {
        setNotificationMessage(
          result.action === 'updated'
            ? 'Cart updated successfully!'
            : 'Added to cart successfully!'
        );
        setShowNotification(true);

        const countResult = await getCartCount(user.id);
        if (countResult.success) {
          setCartCount(countResult.count);
        }

        setIsModalOpen(false);
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
      setSelectedPackage(null);
      router.push('/cart');
    }
  };
  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  };

  if (loading) {
    return (
      <div className="min-h-screen max-w-7xl w-full mx-auto mt-30">

       <SkeletonServiceDetail/>

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
    <div className="min-h-screen bg-background py-8 px-4 mt-20">
      <div className="max-w-7xl mx-auto">
        {/* Header Navigation */}
        <div className="flex justify-between items-center mb-8">
          <Button
            onClick={() => router.push('/service')}
            variant="ghost"
            className="text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </Button>

        </div>


        <div className="grid md:grid-cols-2  mb-8">
          {/* Image Gallery */}
          <div className="space-y-4 ">
            {images.length > 0 ? (
              <>
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 aspect-[1/1]">
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
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-muted p-1 hover:bg-white cursor-pointer  rounded-full shadow-lg transition-all"
                      >
                        <ChevronLeft className="w-6 h-6 text-primary" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-muted p-1 hover:bg-white cursor-pointer  rounded-full shadow-lg transition-all"
                      >
                        <ChevronRight className="w-6 h-6 text-primary" />
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
              </>
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-100 rounded-2xl">
                <Image className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Category Description */}
          <div className="max-w-md mx-auto">
            <div className="flex flex-col justify-between items-center col-span-3">
              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-bold text-primary mb-4 mt-5">{category.name}</h1>
                  {category.description && (
                    <p className="text-gray-600 text-lg leading-relaxed py-8">{category.description}</p>
                  )}
                </div>


              </div>
              {category.start_price && (
                <div className='py-5 w-full'>
                  <p className="text-sm text-gray-500 mb-2 ">Start From</p>
                  <div className="text-3xl font-bold text-secondary">
                    {formatCurrency(category.start_price)}
                  </div>
                </div>
              )}

              {/* CTA Button - Only on Desktop */}
              <div className="mt-8 w-full">

                <Button
                  size="lg"
                  onClick={() => setIsModalOpen(true)}
                  className="w-full bg-primary text-white rounded-full text-lg py-6 hidden md:flex items-center justify-center"
                  disabled={packages.length === 0}
                >
                  <Package className="w-5 h-5 mr-2" />
                  Select Package
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-20 p-5">
          <h3 className="text-2xl md:text-4xl font-bold mb-4 text-[#50398e] relative inline-block">
            How To Order
            <span className="absolute -top-3 -right-5 text-3xl">✦</span>
          </h3>
        </div>


        <section className='py-3 mb-20'>
          <div className="relative">
            {/* Desktop Timeline */}
            <div className="hidden md:flex justify-between items-start p-5">
              {[
                { step: "1", title: "Select Package", desc: "Choose your perfect plan", display: "opacity-0" },
                { step: "2", title: "Add to Cart", desc: "Review your selection", display2: "opacity-0" },
                { step: "3", title: "Complete Order", desc: "Fill in the details", display: "opacity-0" },
                { step: "4", title: "Payment", desc: "Secure checkout", display2: "opacity-0" },
                { step: "5", title: "Get Started", desc: "We begin your project", display: "opacity-0" }
              ].map((item, i, arr) => (
                <div key={i} className="flex flex-col items-center flex-1 relative">
                  <div className="flex items-center w-full">
                    <div className={`flex flex-col items-center z-10`}>
                      <div className={`${item.display}`}>
                        <h3 className="font-semibold  text-gray-900 text-center mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-500 text-center">{item.desc}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg my-3">
                        {item.step}
                      </div>
                      <div className={`${item.display2}`}>
                        <h3 className="font-semibold text-gray-900 text-center mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-500 text-center">{item.desc}</p>
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="w-full h-1 bg-secondary mx-15  absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Timeline */}
            <div className="md:hidden space-y-4">
              {[
                { step: "1", title: "Select Package", desc: "Choose your perfect plan" },
                { step: "2", title: "Add to Cart", desc: "Review your selection" },
                { step: "3", title: "Complete Order", desc: "Fill in the details" },
                { step: "4", title: "Payment", desc: "Secure checkout" },
                { step: "5", title: "Get Started", desc: "We begin your project" }
              ].map((item, i, arr) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                      {item.step}
                    </div>
                    {i < arr.length - 1 && (
                      <div className="w-0.5 h-12 bg-purple-200 my-1"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>



        {/* Features Section */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">What's Included</CardTitle>
            <CardDescription>All packages include these premium features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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


        {/* Package Selection - Mobile Only (Inline) */}
        {isMobile && packages.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Package</h2>
            <p className="text-gray-600 mb-6">Select the perfect package for your needs</p>

            <div className="grid grid-cols-1 gap-6">
              {packages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className="transition-all hover:shadow-xl bg-white"
                >
                  <CardHeader className="pb-3">
                    <Badge className="w-fit mb-2 bg-purple-100 text-purple-700">
                      {pkg.package}
                    </Badge>
                    <CardTitle className="text-xl">{pkg.name}</CardTitle>
                    <div className="text-3xl font-bold text-secondary mt-2">
                      {formatCurrency(pkg.price)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pkg.description && (
                      <p className="text-gray-600 text-sm">{pkg.description}</p>
                    )}

                    <Button
                      onClick={() => handleAddToCart(pkg.id.toString())}
                      disabled={isAddingToCart && selectedPackage === pkg.id.toString()}
                      className="w-full bg-primary hover:bg-purple-700 text-white"
                      size="lg"
                    >
                      {isAddingToCart && selectedPackage === pkg.id.toString() ? (
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        <div className="mt-20">

        <CategoryCarousel/>
        </div>
      </div>

      {/* Custom Full Screen Modal - Desktop Only */}
      {isModalOpen && !isMobile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="container mx-auto px-4 py-8 max-w-7xl">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Choose Your Package</h2>
                  <p className="text-gray-300 text-lg">
                    Select the perfect package for your needs and add it to order
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Package Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className="transition-all hover:shadow-2xl  bg-white"
                  >
                    <CardHeader className="pb-3">
                      <Badge className="w-fit mb-2 bg-purple-100 text-purple-700">
                        {pkg.package}
                      </Badge>
                      <CardTitle className="text-xl">{pkg.name}</CardTitle>
                      <div className="text-5xl font-bold text-primary mt-2">
                        ${pkg.price}<span className='text-xl'>.00</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {pkg.description && (
                        <p className="text-gray-600 text-sm min-h-[60px]">{pkg.description}</p>
                      )}

                      <Button
                        onClick={() => handleAddToCart(pkg.id.toString())}
                        disabled={isAddingToCart && selectedPackage === pkg.id.toString()}
                        className="float-end bg-primary rounded-full cursor-pointer hover:scale-105  text-white"
                        size="lg"
                      >
                        {isAddingToCart && selectedPackage === pkg.id.toString() ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Adding...
                          </>
                        ) : (
                          <>
                            Add to Order
                            <ArrowRight className="w-5 h-5 mr-2" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}