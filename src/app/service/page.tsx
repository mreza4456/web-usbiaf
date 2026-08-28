"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Zap, Shield, Star, Clock, ImageIcon, ChevronLeft, ChevronRight, ChevronDown, Search, Flame, TrendingUp, X, SlidersHorizontal, Check } from 'lucide-react';
import { getAllCategories } from '@/action/categories';
import { getAllPosters } from '@/action/poster'; // sesuaikan import path
import { getAllClasses } from '@/action/badge';
import SkeletonService, { SkeletonCard } from '@/components/skeleton-card';
import Link from 'next/link';
import { Textstyle, Textstylegreen } from '@/components/font-design';
import Image from 'next/image';
import { getCloudflareImageUrl } from '@/lib/storage-utils';
import CardDashed, { BadgeCard, CardSecondary } from '@/components/card-dashed';
import { title } from 'process';
import { getAllClasses as getAllClassOptions } from '@/action/class'; // beda dari getAllClasses di action/badge yang sudah ada
import type { ICategory, IImageCategories, IPoster, IClass, IBadge, IClassService } from '@/interface';
import { CTASection } from '../page';

function Pagination({
  currentPage, totalPages, onPageChange,
}: {
  currentPage: number; totalPages: number; onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = useMemo(() => {
    const items: (number | 'ellipsis')[] = [];
    const delta = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        items.push(i);
      } else if (items[items.length - 1] !== 'ellipsis') {
        items.push('ellipsis');
      }
    }
    return items;
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center border-2 border-primary w-fit mx-auto rounded-full justify-center  mt-10 flex-wrap">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-2  text-primary  disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/10 transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {pages.map((p, idx) =>
        p === 'ellipsis' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`min-w-[2.5rem] h-10 px-3  border-l-2 border-primary text-sm font-medium transition-colors ${p === currentPage
              ? 'bg-muted/80 text-primary'
              : 'text-primary border-r-2 border-primary cursor-pointer'
              }`}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="p-2  text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/10 transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// ─── Dropdown (shared helper for Category / Sort by) ───────────────────────────

function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: string;
  options: { key: string; label: string }[];
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLabel = options.find((o) => o.key === value)?.label ?? options[0]?.label;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2  h-9  text-lilita  text-primary text-sm font-medium \transition-colors whitespace-nowrap"
      >
        {label && <span className="text-gray-500 font-normal">{label}</span>}
        <span className="font-semibold"><p>{activeLabel}</p></span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 py-1.5 bg-white overflow-hidden rounded-2xl border border-primary/20 shadow-lg z-20">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                onChange(opt.key);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm text-lilita transition-colors ${opt.key === value
                ? 'text-primary font-semibold bg-muted/50'
                : 'text-primary '
                }`}
            >
              <p>{opt.label}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ServiceToolbar ─────────────────────────────────────────────────────────────

type Filter = 'best_seller' | 'popular' | 'handpick' | null;
type SortKey = 'best_seller' | 'popular' | 'newest' | 'price_low' | 'price_high' | 'name_asc';

function ServiceToolbar({
  badges,
  selectedBadgesId,
  onSelectBadges,
  selectedFilter,
  onSelectFilter,
  search,
  onSearchChange,
  sortBy,
  onSortChange,
}: {
  badges: IBadge[];
  selectedBadgesId: string | number | null;
  onSelectBadges: (id: string | number | null) => void;
  selectedFilter: Filter;
  onSelectFilter: (badge: Filter) => void;
  search: string;
  onSearchChange: (v: string) => void;
  sortBy: SortKey;
  onSortChange: (key: SortKey) => void;
}) {
  const categoryOptions: { key: string; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'popular', label: 'Popular' },
    { key: 'handpick', label: 'Handpick' },
    { key: 'best_seller', label: 'Best Seller' },
  ];

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'best_seller', label: 'Best Seller' },
    { key: 'popular', label: 'Most Popular' },
    { key: 'newest', label: 'Newest' },
    { key: 'price_low', label: 'Price: Low to High' },
    { key: 'price_high', label: 'Price: High to Low' },
    { key: 'name_asc', label: 'Name A-Z' },
  ];

  const pillOptions: { key: string | number | null; label: string }[] = [
    { key: null, label: 'All' },
    ...badges.map((c) => ({ key: c.id, label: c.name })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xl text-lilita">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search everything..."
            className="w-full h-10 pl-10 pr-9 rounded-full border border-primary border-2 bg-white text-sm text-gray-700 placeholder:font-light  focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Class pill group (badges) */}
        {pillOptions.length > 1 && (
          <div className="flex items-center rounded-full border border-primary border-2 overflow-hidden bg-white shrink-0">
            {pillOptions.map((opt, idx) => {
              const isActive = String(selectedBadgesId) === String(opt.key) || (selectedBadgesId === null && opt.key === null);
              return (
                <button
                  key={String(opt.key)}
                  onClick={() => onSelectBadges(opt.key)}
                  className={`px-4 h-9 text-sm font-medium text-lilita whitespace-nowrap cursor-pointer transition-colors ${isActive
                    ? 'bg-muted/80 text-primary'
                    : 'text-primary hover:bg-gray-50'
                    } ${idx !== pillOptions.length - 1 ? ' border-r-2 border-primary ' : ''}`}
                >
                  <p>{opt.label}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Filter dropdown (Popular / Handpick / Best Seller) */}
        {/* <div className="flex text-lilita items-center gap-2">
          <span className="text-sm text-primary hidden font-normal sm:inline">Filter:</span>
          <Dropdown
            value={selectedFilter ?? 'all'}
            options={categoryOptions}
            onChange={(key) => onSelectFilter(key === 'all' ? null : (key as Filter))}
          />
        </div> */}

        {/* Sort by dropdown (termasuk Price) */}
        <div className="flex text-lilita items-center gap-2 ml-auto">
          <span className="text-md text-primary hidden font-normal sm:inline"><p>Sort by:</p></span>
          <Dropdown
            value={sortBy}
            options={sortOptions}
            onChange={(key) => onSortChange(key as SortKey)}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Interface ─────────────────────────────────────────────────────────────────

interface ICategoryWithImages extends ICategory {
  images?: IImageCategories[];
  classServices?: IClassService[]; // relasi many-to-many dari class_services
}
const ITEMS_PER_PAGE = 15;

// ─── Inner Component (butuh useSearchParams, jadi harus di dalam Suspense) ─────

function ServicesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<ICategoryWithImages[]>([]);
  const [poster, setPoster] = useState<IPoster[]>([]);
  const [badges, setBadges] = useState<IBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // ── Baca initial value dari query params (badge & classes) ──
  const [selectedBadgesId, setSelectedBadgesId] = useState<string | number | null>(
    searchParams.get('badge')
  );
  const [selectedFilter, setSelectedFilter] = useState<Filter>(null);
  const [sortBy, setSortBy] = useState<SortKey>('best_seller');

  const [classOptions, setClassOptions] = useState<IClass[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<(string | number)[]>(
    searchParams.get('classes')?.split(',').filter(Boolean) ?? []
  );

  // Guard supaya efek sync-ke-URL nggak jalan sebelum initial read dari URL selesai
  const isFirstRender = useRef(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await getAllCategories();
        if (result.success && Array.isArray(result.data)) {
          setCategories(result.data);
        } else {
          setCategories([]);
          setError(result.message || 'Failed to load categories');
        }
      } catch {
        setCategories([]);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    const fetchPoster = async () => {
      try {
        const result = await getAllPosters();
        if (result.success && Array.isArray(result.data)) {
          setPoster(result.data);
        } else {
          console.error('Failed to fetch Poster:', result.message);
          setPoster([]);
        }
      } catch (error) {
        console.error('Failed to fetch Poster:', error);
        setPoster([]);
      }
    };

    const fetchBadges = async () => {
      try {
        const result = await getAllClasses();
        if (result.success && Array.isArray(result.data)) {
          setBadges(result.data);
        } else {
          setBadges([]);
        }
      } catch (error) {
        console.error('Failed to fetch Badges:', error);
        setBadges([]);
      }
    };

    const fetchClassOptions = async () => {
      try {
        const result = await getAllClassOptions();
        if (result.success && Array.isArray(result.data)) {
          setClassOptions(result.data);
        } else {
          setClassOptions([]);
        }
      } catch (error) {
        console.error('Failed to fetch Class Options:', error);
        setClassOptions([]);
      }
    };

    fetchCategories();
    fetchPoster();
    fetchBadges();
    fetchClassOptions();
  }, []);

  // Debounce search input so filtering doesn't run on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  // ── Sync selectedBadgesId & selectedClassIds ke URL query params ──
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (selectedBadgesId) {
      params.set('badge', String(selectedBadgesId));
    } else {
      params.delete('badge');
    }

    if (selectedClassIds.length > 0) {
      params.set('classes', selectedClassIds.join(','));
    } else {
      params.delete('classes');
    }

    const qs = params.toString();
    router.replace(qs ? `/service?${qs}` : '/service', { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBadgesId, selectedClassIds]);

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/service/detail/${categoryId}`);
  };

  // toggle pilih/hapus class dari filter (multi-select)
  const toggleClassFilter = (classId: string | number) => {
    setSelectedClassIds((prev) => {
      const exists = prev.some((id) => String(id) === String(classId));
      if (exists) {
        return prev.filter((id) => String(id) !== String(classId));
      }
      return [...prev, classId];
    });
  };

  const clearClassFilter = () => setSelectedClassIds([]);

  // ── Map badge_id -> class_name untuk ditampilkan di card ──
  const classMap = useMemo(() => {
    const map = new Map<string, string>();
    badges.forEach((c) => map.set(String(c.id), c.name));
    return map;
  }, [badges]);

  const filteredCategories = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    const list = categories.filter((category) => {
      const matchesSearch = term ? category.name.toLowerCase().includes(term) : true;

      const matchesClass = selectedBadgesId
        ? String((category as any).badge_id) === String(selectedBadgesId)
        : true;

      const matchesBadge = selectedFilter
        ? selectedFilter === 'best_seller'
          ? !!(category as any).is_best_seller
          : selectedFilter === 'popular'
            ? !!(category as any).is_popular
            : !!(category as any).is_handpick
        : true;

      // filter multi-class — category harus punya minimal 1 class yang match dengan selectedClassIds
      const matchesMultiClass =
        selectedClassIds.length === 0
          ? true
          : category.classServices?.some((cs) =>
            selectedClassIds.some((id) => String(id) === String(cs.class_id))
          ) ?? false;

      return matchesSearch && matchesClass && matchesBadge && matchesMultiClass;
    });

    const sorted = [...list];
    switch (sortBy) {
      case 'best_seller':
        sorted.sort((a, b) => (Number((b as any).sales) || 0) - (Number((a as any).sales) || 0));
        break;
      case 'popular':
        sorted.sort((a, b) => Number(!!(b as any).is_popular) - Number(!!(a as any).is_popular));
        break;
      case 'newest':
        sorted.sort((a, b) => {
          const bd = new Date((b as any).created_at ?? 0).getTime();
          const ad = new Date((a as any).created_at ?? 0).getTime();
          return bd - ad;
        });
        break;
      case 'price_low':
        sorted.sort((a, b) => (Number(a.start_price) || 0) - (Number(b.start_price) || 0));
        break;
      case 'price_high':
        sorted.sort((a, b) => (Number(b.start_price) || 0) - (Number(a.start_price) || 0));
        break;
      case 'name_asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return sorted;
  }, [categories, debouncedSearch, selectedBadgesId, selectedFilter, sortBy, selectedClassIds]);

  // ── Pagination derived values (pakai filteredCategories) ──
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Reset ke halaman 1 setiap kali filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedBadgesId, selectedFilter, sortBy, selectedClassIds]);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCategories.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCategories, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const formatSales = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
    }
    return value
  };
  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  return (
    <div className="min-h-screen mt-30 sm:mt-10 max-w-7xl mx-auto">

      {/* ── Hero Section ── */}
      <section className="pb-5 sm:pt-30  px-4 sm:px-6">
        <div className="container mx-auto">
          <div>
            <div className="flex flex-col  w-full mt-5">
              <h1 className="text-5xl sm:text-7xl  w-full text-primary" >COMMISIONS</h1>
              <h1 className="text-5xl sm:text-7xl  w-full text-primary" >FOR <span className='bg-title'>VTUBER</span></h1>
            </div>
          </div>

        </div>
      </section>

      <section className="py-10  px-4 sm:px-6">
        {loading ? (
          <SkeletonCard height={20} cardcount={14} className='grid xl:grid-cols-7 lg:grid-cols-5 md:grid-cols-4 sm:grid-cols-3 grid-cols-2 gap-7' />
        ) : (
          <div className="container mx-auto grid xl:grid-cols-7 lg:grid-cols-5 md:grid-cols-4 sm:grid-cols-3 grid-cols-2 gap-7">
            {classOptions.map((c) => {
              const isActive = selectedClassIds.some((id) => String(id) === String(c.id));
              return (
                <CardSecondary
                  key={c.id}
                  onClick={() => toggleClassFilter(c.id)}
                  className={`h-full relative min-w-[110px] cursor-pointer transition`}
                >
                  {isActive ? (
                    <div>
                      <Check className='w-5 h-5 absolute z-10 text-primary top-3 right-3' />
                    </div>
                  ) : (
                    <div></div>
                  )}
                  <div className={`md:pt-10 pt-5 text-xs md:text-lg pb-3 px-3  ${isActive ? 'bg-muted/50' : ''
                    }  text-lilita text-primary h-full`}>
                    {c.class_name}
                  </div>
                </CardSecondary>
              );
            })}
            <CardSecondary
              onClick={clearClassFilter}
              className={`h-full relative min-w-[110px] cursor-pointer transition `}
            >
              <div className={`md:pt-10 pt-5 text-xs md:text-lg pb-3 px-3  ${selectedClassIds.length === 0 ? 'bg-muted/50' : ''
                }  text-lilita text-primary h-full`}>
                All
              </div>
            </CardSecondary>
          </div>
        )}
      </section>

      {/* ── Toolbar + Service Categories ── */}
      <section className="py-12 sm:pb-16 px-5 sm:px-6 bg-white">
        <div className="container mx-auto">
          <div className="mb-8">
            <ServiceToolbar
              badges={badges}
              selectedBadgesId={selectedBadgesId}
              onSelectBadges={setSelectedBadgesId}
              selectedFilter={selectedFilter}
              onSelectFilter={setSelectedFilter}
              search={search}
              onSearchChange={setSearch}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </div>

          {/* Content */}
          <div className="min-w-0">
            {loading ? (
              <SkeletonService height={60} className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" count={10} />
            ) : error ? (
              <div>
                <Card className="bg-muted/50 backdrop-blur-sm border-[#9B5DE0]/30">
                  <CardContent className="py-12 text-center">
                    <p className="text-red-400">{error}</p>
                  </CardContent>
                </Card>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div>
                <Card className="bg-muted/50 backdrop-blur-sm border-[#9B5DE0]/30">
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-800">
                      {categories.length === 0
                        ? 'No categories available at the moment.'
                        : 'No services match your search or filter.'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                <div
                  key={currentPage}
                  className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                >
                  {paginatedCategories.map((category, index) => {
                    const primaryImage = category.images?.[0]?.image_url || '';
                    const className = classMap.get(String((category as any).badge_id));
                    const isBestSeller = (category as any).is_best_seller;
                    const isTopPopular = (category as any).is_popular;
                    const isHandpick = (category as any).is_handpick;
                    const isAboveFold = currentPage === 1 && index < 4;

                    return (
                      <div key={category.id}>
                        <div
                          onClick={(e) => { e.stopPropagation(); handleCategoryClick(category.id); }}
                          className=" relative h-full hover:scale-[1.05] transition     cursor-pointer gap-0"
                        >
                          <CardDashed>
                            <div className="relative aspect-square ">
                              {primaryImage ? (
                                <Image
                                  className="object-cover rounded   rounded-[14%]"
                                  src={primaryImage}
                                  alt={category.name}
                                  fill
                                  loading={isAboveFold ? 'eager' : 'lazy'}
                                  priority={isAboveFold}
                                  sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-image.svg'; }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <ImageIcon className="w-16 h-16 text-gray-400" />
                                </div>
                              )}
                              {className && (
                                <BadgeCard className="inline-flex absolute top-[-12px] -rotate-4 left-4 z-10 items-center rounded-full text-[10px] sm:text-sm">
                                  {className}
                                </BadgeCard>
                              )}
                            </div>
                          </CardDashed>

                          <div className="p-3 ">
                            <div>
                              <h1
                                onClick={(e) => { e.stopPropagation(); handleCategoryClick(category.id); }}
                                className=" sm:text-2xl text-lg text-primary line-clamp-2 group-hover:text-primary/80 transition-colors"
                              >
                                {category.name
                                  ?.split(" ")
                                  .slice(0, 4)
                                  .join(" ")}
                              </h1>
                              <h1 className=' text-primary bg-title w-fit  text-2xl md:text-3xl'>{formatCurrency(category.start_price as any)}  </h1>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <CTASection />
    </div>
  );
}

// ─── Main Component (wrapper Suspense) ─────────────────────────────────────────

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <SkeletonCard
          height={20}
          cardcount={14}
          className="grid xl:grid-cols-7 lg:grid-cols-5 md:grid-cols-4 sm:grid-cols-3 grid-cols-2 gap-7"
        />
      }
    >
      <ServicesPageInner />
    </Suspense>
  );
}