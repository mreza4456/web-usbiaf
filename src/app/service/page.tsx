"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Zap, Shield, Star, Clock, ImageIcon, ChevronLeft, ChevronRight, ChevronDown, Search, Flame, TrendingUp, X, SlidersHorizontal } from 'lucide-react';
import { getAllCategories } from '@/action/categories';
import { getAllPosters } from '@/action/poster'; // sesuaikan import path
import { getAllClasses } from '@/action/class';
import type { ICategory, IImageCategories, IPoster, IClass } from '@/interface';
import SkeletonService from '@/components/skeleton-card';
import Link from 'next/link';
import { Textstyle, Textstylegreen } from '@/components/font-design';
import Image from 'next/image';
import { getCloudflareImageUrl } from '@/lib/storage-utils';
import CardDashed from '@/components/card-dashed';
import { title } from 'process';


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
    <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-full border border-primary/30 text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/10 transition-colors"
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
            className={`min-w-[2.5rem] h-10 px-3 rounded-full text-sm font-medium transition-colors ${p === currentPage
              ? 'bg-primary text-white'
              : 'text-primary border border-primary/30 hover:bg-primary/10'
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
        className="p-2 rounded-full border border-primary/30 text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/10 transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// ─── PosterCarousel ────────────────────────────────────────────────────────────

function PosterCarousel({ posters }: { posters: IPoster[] }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isAnimating, setIsAnimating] = useState(false);

  const goTo = useCallback((index: number, dir?: 1 | -1) => {
    if (isAnimating || index === current) return;
    setDirection(dir ?? (index > current ? 1 : -1));
    setIsAnimating(true);
    setCurrent(index);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, current]);

  const prev = () => goTo((current - 1 + posters.length) % posters.length, -1);
  const next = () => goTo((current + 1) % posters.length, 1);

  if (!posters.length) return null;

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%' }),
    center: { x: '0%' },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%' }),
  };

  return (
    <section className="relative w-full overflow-hidden mt-20" style={{ height: '400px' }}>
      <div>
        <div
          key={current}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            className="w-full h-full object-cover"
            src={getCloudflareImageUrl(posters[current].image_url, "large")}
            alt={posters[current].id}
            fill
            priority={current === 0}
            loading={current === 0 ? 'eager' : 'lazy'}
            sizes="100vw"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-image.svg'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>
      </div>

      {posters.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-muted hover:bg-muted text-white rounded-full p-2 transition-all duration-200"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-muted hover:bg-muted text-white rounded-full p-2 transition-all duration-200"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {posters.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`transition-all duration-300 rounded-full ${i === current
                  ? 'w-3 h-3 bg-primary'
                  : 'w-3 h-3 border border-primary border-2 '
                  }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
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
        className="flex items-center gap-1.5 px-4 h-10 rounded-full border border-2 border-primary text-primary text-sm font-medium hover:bg-primary/5 transition-colors whitespace-nowrap"
      >
        {label && <span className="text-gray-500 font-normal">{label}</span>}
        <span className="font-semibold">{activeLabel}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 py-1.5 bg-white rounded-2xl border border-primary/20 shadow-lg z-20">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                onChange(opt.key);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${opt.key === value
                ? 'text-primary font-semibold bg-primary/5'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ServiceToolbar ─────────────────────────────────────────────────────────────

type BadgeFilter = 'best_seller' | 'popular' | 'handpick' | null;
type SortKey = 'best_seller' | 'popular' | 'newest' | 'price_low' | 'price_high' | 'name_asc';

function ServiceToolbar({
  classes,
  selectedClassId,
  onSelectClass,
  selectedBadge,
  onSelectBadge,
  search,
  onSearchChange,
  sortBy,
  onSortChange,
}: {
  classes: IClass[];
  selectedClassId: string | number | null;
  onSelectClass: (id: string | number | null) => void;
  selectedBadge: BadgeFilter;
  onSelectBadge: (badge: BadgeFilter) => void;
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
    ...classes.map((c) => ({ key: c.id, label: c.class_name })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search everything..."
            className="w-full h-10 pl-10 pr-9 rounded-full border border-primary border-2 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
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

        {/* Category dropdown (Highlight filter) */}


        {/* Class pill group */}
        <div className='rounded-full flex px-4 items-center border h-9.5 text-sm font-medium border-primary border-2 bg-white arial text-primary'>Category</div>
        {pillOptions.length > 1 && (
          <div className="flex items-center rounded-full border border-primary border-2 overflow-hidden bg-white shrink-0">
            {pillOptions.map((opt, idx) => {
              const isActive = String(selectedClassId) === String(opt.key) || (selectedClassId === null && opt.key === null);
              return (
                <button
                  key={String(opt.key)}
                  onClick={() => onSelectClass(opt.key)}
                  className={`px-4 h-9.5 text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${isActive
                    ? 'bg-muted/80 text-primary'
                    : 'text-primary hover:bg-gray-50'
                    } ${idx !== pillOptions.length - 1 ? ' border-r-2 border-primary ' : ''}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}


        {/* Sort by */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-primary hidden sm:inline">Sort by:</span>
          <Dropdown
            value={selectedBadge ?? 'all'}
            options={categoryOptions}
            onChange={(key) => onSelectBadge(key === 'all' ? null : (key as BadgeFilter))}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Interface ─────────────────────────────────────────────────────────────────

interface ICategoryWithImages extends ICategory {
  images?: IImageCategories[];
}

const ITEMS_PER_PAGE = 15;

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ICategoryWithImages[]>([]);
  const [poster, setPoster] = useState<IPoster[]>([]);
  const [classes, setClasses] = useState<IClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | number | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<BadgeFilter>(null);
  const [sortBy, setSortBy] = useState<SortKey>('best_seller');

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

    const fetchClasses = async () => {
      try {
        const result = await getAllClasses();
        if (result.success && Array.isArray(result.data)) {
          setClasses(result.data);
        } else {
          setClasses([]);
        }
      } catch (error) {
        console.error('Failed to fetch Classes:', error);
        setClasses([]);
      }
    };

    fetchCategories();
    fetchPoster();
    fetchClasses();
  }, []);

  // Debounce search input so filtering doesn't run on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/service/detail/${categoryId}`);
  };

  // ── Map class_id -> class_name untuk ditampilkan di card ──
  const classMap = useMemo(() => {
    const map = new Map<string, string>();
    classes.forEach((c) => map.set(String(c.id), c.class_name));
    return map;
  }, [classes]);

  const filteredCategories = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    const list = categories.filter((category) => {
      const matchesSearch = term ? category.name.toLowerCase().includes(term) : true;

      const matchesClass = selectedClassId
        ? String((category as any).class_id) === String(selectedClassId)
        : true;

      const matchesBadge = selectedBadge
        ? selectedBadge === 'best_seller'
          ? !!(category as any).is_best_seller
          : selectedBadge === 'popular'
            ? !!(category as any).is_popular
            : !!(category as any).is_handpick
        : true;

      return matchesSearch && matchesClass && matchesBadge;
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
  }, [categories, debouncedSearch, selectedClassId, selectedBadge, sortBy]);

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
  }, [debouncedSearch, selectedClassId, selectedBadge, sortBy]);

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

const service = [
  {
    title: "Illustration",
    link: "/services/illustration",
  },
  {
    title: "Design",
    link: "/services/design",
  },
  {
    title: "Animation",
    link: "/services/animation",
  },
  {
    title: "Coded",
    link: "/services/coded",
  },
  {
    title: "3D Model",
    link: "/services/3d-model",
  },
  {
    title: "Editing",
    link: "/services/editing",
  },
  {
    title: "Music",
    link: "/services/music",
  },
  {
    title: "VTuber",
    link: "/services/vtuber",
  },
  {
    title: "PonyTuber",
    link: "/services/ponytuber",
  },
  {
    title: "VTuber",
    link: "/services/vtuber",
  },
  {
    title: "Social Media",
    link: "/services/social-media",
  },
  {
    title: "Branding",
    link: "/services/branding",
  },
  {
    title: "Bundling",
    link: "/services/bundling",
  },
  {
    title: "Other",
    link: "/services/other",
  },
]
  return (
    <div className="min-h-screen">

 

      {/* ── Hero Section ── */}
      <section className="pb-5 sm:pt-30  px-4 sm:px-6">
        <div className="container mx-auto">
          <div>
            <div className="flex gap-5 w-full mt-5">
              <h1 className="text-4xl sm:text-6xl  w-full text-[#6B50B0] text-borsok" >Find Our Services</h1>
            </div>
          </div>
          <div className="max-w-3xl">
            <p

              className="text-lg  arial"
            >
              Explore our collection and portofolio and browse for your reffrences
            </p>
          </div>
        </div>
      </section>
           <section className="py-10  px-4 sm:px-6">
        <div className=" container mx-auto grid xl:grid-cols-7 lg:grid-cols-6 md:grid-cols-5 sm:grid-cols-4 grid-cols-3 gap-7">
          {service.map((service, i) => (
            <div key={i} className="card-secondary-white rounded rounded-3xl ">
              <div className='card-shadow rounded-3xl '></div>
              <div className='md:pt-10 pt-5   pb-3 px-5 arial bg-white h-full rounded-2xl'>
                {service.title}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Toolbar + Service Categories ── */}
      <section className="py-12 sm:pb-16 px-5 sm:px-6 bg-white">
        <div className="container mx-auto">
          <div className="mb-8">
            <ServiceToolbar
              classes={classes}
              selectedClassId={selectedClassId}
              onSelectClass={setSelectedClassId}
              selectedBadge={selectedBadge}
              onSelectBadge={setSelectedBadge}
              search={search}
              onSearchChange={setSearch}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </div>

          {/* Content */}
          <div className="min-w-0">
            {loading ? (
              <SkeletonService />
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
                    const className = classMap.get(String((category as any).class_id));
                    const isBestSeller = (category as any).is_best_seller;
                    const isTopPopular = (category as any).is_popular;
                    const isHandpick = (category as any).is_handpick;
                    // Only the very first row of cards is likely above the fold on first paint
                    const isAboveFold = currentPage === 1 && index < 4;

                    return (
                      <div key={category.id}>
                        <div
                          onClick={(e) => { e.stopPropagation(); handleCategoryClick(category.id); }}
                          className=" relative h-full hover:scale-[1.05] transition     cursor-pointer gap-0"
                        >
                          <CardDashed className='rounded-4xl'>
                            <div className="relative aspect-square ">
                              {primaryImage ? (
                                <Image
                                  className="object-cover rounded  rounded-xl"
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
                            </div>
                          </CardDashed>
                          {(isHandpick || isTopPopular || isBestSeller) && (
                            <div className="flex flex-wrap gap-1.5 mt-2 absolute top-2 left-2 z-10">
                              {isTopPopular && (
                                <span className="inline-flex  items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-pink-100 text-pink-700">
                                  <TrendingUp className="w-3 h-3" />
                                  Popular
                                </span>
                              )}
                              {isHandpick && (
                                <span className="inline-flex  items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-green-100 text-green-700">
                                  <Flame className="w-3 h-3" />
                                  Handpick
                                </span>
                              )}
                              {isBestSeller && (
                                <span className="inline-flex  items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-yellow-100 text-yellow-700">
                                  <Star className="w-3 h-3" />
                                  Best Seller
                                </span>
                              )}
                            </div>


                          )}

                          <div className="p-3 ">
                            <div>
                              {/* Nama */}
                              <h3
                                onClick={(e) => { e.stopPropagation(); handleCategoryClick(category.id); }}
                                className=" sm:text-lg text-sm  text-eliane text-primary line-clamp-2 group-hover:text-primary/80 transition-colors"
                              >
                                {category.name
                                  ?.split(" ")
                                  .slice(0, 4)
                                  .join(" ")}
                              </h3>

                              {/* Class - di bawah nama */}

                              {/* <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                                {className}
                              </p> */}
                              <p className='arial text-xl'>{formatCurrency(category.start_price as any)}  </p>
                            </div>
                            {/* Best Seller & Popular badges - di bawah class */}

                            {/* <div className="flex justify-between items-center">

                              {category.sales != null && (
                                <p className="arial text-sm">
                                  ({formatSales(category.sales as any)}){" "}
                                  <span className="text-gray-500">sold</span>
                                </p>
                              )}
                            </div> */}
                          </div>
                          {/* {isBestSeller && (
                            <div className="absolute top-0 right-3 md:right-5 w-7 h-10 md:h-18 rounded-b-full md:w-12 bg-yellow-500 flex flex-col justify-end items-center">
                              <div className="clip-stars md:h-6 md:w-6 w-3 h-3 bg-white mb-2 md:mb-5" />
                            </div>
                          )} */}


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
      <section className="py-20 px-4 sm:px-6">
        <div className="container mx-auto">
          <div>
            <Card className="bg-[#e6dcff] md:rounded-[100px] ">
              <CardContent className="text-center py-12 sm:py-16 px-4 sm:px-6">
                <h2 className="text-3xl sm:text-4xl md:text-5xl text-borsok text-primary mb-4 sm:mb-6">
                  Can't Find What You're{' '}
                  <span className="text-primary">Looking For?</span>
                </h2>
                <p className="text-arial text-primary/50 sm:text-lg mb-6 sm:mb-8 max-w-3xl mx-auto">
                  Contact us to make custom project to fit with your request and personalized
                </p>
                <Link href="/order">
                  <div>
                    <Button size="sm" className="button-yellow text-xl p-5 ">
                      Request Custom Project
                    </Button>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}