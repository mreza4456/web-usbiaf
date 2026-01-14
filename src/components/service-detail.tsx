"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, CheckCircle2, Star, Package, ArrowLeft, ShoppingCart } from 'lucide-react';
import { getCategoriesById } from '@/action/categories';
import { getPackageCategoriesByCategoryId } from '@/action/package';
import type { ICategory, IPackageCategories } from '@/interface';

interface CategoryDetailProps {
  categoryId: string;
  onBack?: () => void;
}

export default function CategoryDetail({ categoryId, onBack }: CategoryDetailProps) {
  const [category, setCategory] = useState<ICategory | null>(null);
  const [packages, setPackages] = useState<IPackageCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Validate categoryId
      if (!categoryId || categoryId === 'undefined' || categoryId === 'null') {
        setError('Invalid category ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch category details
        const categoryResult = await getCategoriesById(categoryId);
        if (categoryResult.success && categoryResult.data) {
          setCategory(categoryResult.data);
        } else {
          setError(categoryResult.message || 'Failed to load category');
          setLoading(false);
          return;
        }

        // Fetch packages for this category
        const packagesResult = await getPackageCategoriesByCategoryId(categoryId);
        if (packagesResult.success && Array.isArray(packagesResult.data)) {
          setPackages(packagesResult.data);
        } else {
          console.warn('No packages found or error:', packagesResult.message);
          setPackages([]);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 py-12">
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-[#9B5DE0]/30 border-t-[#D78FEE] rounded-full animate-spin"></div>
            <p className="text-gray-800 mt-4">Loading Category Details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 py-12">
          <Card className="bg-muted/50 backdrop-blur-sm border-[#9B5DE0]/30">
            <CardContent className="py-12 text-center">
              <p className="text-red-400">{error || 'Category not found'}</p>
              {onBack && (
                <Button onClick={onBack} className="mt-4 bg-[#9B5DE0] hover:bg-[#8049c7]">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Services
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="container mx-auto">
          {onBack && (
            <Button 
              onClick={onBack} 
              variant="ghost" 
              className="mb-6 text-primary hover:text-[#8049c7] hover:bg-[#9B5DE0]/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Services
            </Button>
          )}

          <div className="text-center">
            <Badge className="inline-block mb-6 px-4 py-2 bg-muted rounded-full shadow-sm border-2 border-[#dbc8fb]">
              <span className="text-sm font-semibold text-[#50398e]">✨ {category.name}</span>
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl text-primary font-bold mb-6 leading-tight">
              <span className="text-primary relative">
                {category.name}
                <div className="absolute -bottom-2 left-0 w-full h-3 bg-[#FFE66D] opacity-50 -rotate-3 -z-5"></div>
              </span>
              <span className="block text-3xl sm:text-4xl md:text-5xl mt-4">Packages</span>
            </h1>
            
            {category.description && (
              <p className="text-lg sm:text-xl text-gray-800 mb-4 max-w-3xl mx-auto">
                {category.description}
              </p>
            )}
            
            {category.start_price && (
              <Badge className="inline-block px-4 py-2 bg-gradient-to-r from-[#9B5DE0] to-[#D78FEE] text-white">
                <span className="text-sm font-semibold">Mulai dari {category.start_price}</span>
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Category Image */}
      {category.image_url && (
        <section className="pb-12 px-4 sm:px-6">
          <div className="container mx-auto">
            <Card className="overflow-hidden bg-muted/50 backdrop-blur-sm border-[#9B5DE0]/30">
              <img 
                src={category.image_url} 
                alt={category.name}
                className="w-full h-64 sm:h-96 object-cover"
              />
            </Card>
          </div>
        </section>
      )}

      {/* Packages Section */}
      <section className="pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl text-primary font-bold mb-4">
              Choose Your Package
            </h2>
            <p className="text-lg text-gray-800 max-w-2xl mx-auto">
              Pilih paket yang sesuai dengan kebutuhan dan budget Anda
            </p>
          </div>

          {packages.length === 0 ? (
            <Card className="bg-muted/50 backdrop-blur-sm border-[#9B5DE0]/30">
              <CardContent className="py-12 text-center">
                <Package className="w-16 h-16 text-[#9B5DE0] mx-auto mb-4" />
                <p className="text-gray-800 text-lg">Belum ada paket tersedia untuk kategori ini.</p>
                <p className="text-gray-600 text-sm mt-2">Silakan hubungi kami untuk informasi lebih lanjut.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`bg-muted/50 backdrop-blur-sm border-[#9B5DE0]/30 hover:border-[#D78FEE]/50 transition-all duration-300 hover:transform hover:scale-105 cursor-pointer ${
                    selectedPackage === pkg.id ? 'ring-2 ring-[#D78FEE] border-[#D78FEE]' : ''
                  }`}
                  onClick={() => setSelectedPackage(pkg.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <Badge className="bg-gradient-to-r from-[#9B5DE0] to-[#D78FEE] text-white">
                        {pkg.package}
                      </Badge>
                      {selectedPackage === pkg.id && (
                        <CheckCircle2 className="w-6 h-6 text-[#D78FEE]" />
                      )}
                    </div>
                    
                    <CardTitle className="text-2xl text-primary mb-2 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#D78FEE]" />
                      {pkg.name}
                    </CardTitle>
                    
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-primary">
                        {formatPrice(pkg.price)}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {pkg.description && (
                      <CardDescription className="text-gray-700 mb-6">
                        {pkg.description}
                      </CardDescription>
                    )}
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-[#9B5DE0] to-[#D78FEE] hover:from-[#8049c7] hover:to-[#c576e0] text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle order action
                      }}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Order Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:pb-16 px-4 sm:px-6">
        <div className="container mx-auto">
          <Card className="bg-muted/50 border-primary/30">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-primary mb-2">
                What's Included
              </CardTitle>
              <CardDescription className="text-gray-700">
                Semua paket mencakup fitur-fitur premium berikut
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                {[
                  { icon: CheckCircle2, text: "Custom design sesuai brand" },
                  { icon: CheckCircle2, text: "2x revisi gratis" },
                  { icon: CheckCircle2, text: "Full HD & 4K ready" },
                  { icon: CheckCircle2, text: "Source files included" },
                  { icon: CheckCircle2, text: "Commercial license" },
                  { icon: CheckCircle2, text: "24/7 support" }
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#9B5DE0]/30 to-[#D78FEE]/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-[#D78FEE]" />
                    </div>
                    <p className="text-gray-800">{feature.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:pb-16 px-4 sm:px-6">
        <div className="container mx-auto">
          <Card className="bg-gradient-to-r from-[#9B5DE0] to-[#D78FEE] border-0">
            <CardContent className="py-12 text-center">
              <Star className="w-16 h-16 text-white mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-white mb-4">
                Siap Upgrade Streaming Anda?
              </h3>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                Dapatkan desain premium yang akan membuat stream Anda lebih profesional dan menarik
              </p>
              <Button 
                size="lg"
                className="bg-white text-[#9B5DE0] hover:bg-gray-100"
              >
                Hubungi Kami
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}