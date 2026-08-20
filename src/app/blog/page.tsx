"use client";

import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X, ArrowRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { getAllBlogPosts } from '@/action/blog';
import { IBlogPost } from '@/interface';
import { SkeletonBlog } from '@/components/skeleton-card';

import { useRouter } from 'next/navigation';
import CardDashed from '@/components/card-dashed';

// ─── Static data ────────────────────────────────────────────────────────────

const categoryFilters = ['All', 'VTubers', 'Docs', 'Tips', 'Streaming'];

const faqCategories = [
  {
    title: 'Common Question',
    items: [
      'Does it cost anything to get verified?',
      'Does it cost anything to get verified?',
      'Does it cost anything to get verified?',
      'Does it cost anything to get verified?',
    ],
  },
  {
    title: 'Commission',
    items: [
      'Does it cost anything to get verified?',
      'Does it cost anything to get verified?',
      'Does it cost anything to get verified?',
      'Does it cost anything to get verified?',
    ],
  },
  {
    title: 'Help',
    items: [
      'Does it cost anything to get verified?',
      'Does it cost anything to get verified?',
      'Does it cost anything to get verified?',
      'Does it cost anything to get verified?',
    ],
  },
  {
    title: 'Policies',
    items: [
      'Does it cost anything to get verified?',
      'Does it cost anything to get verified?',
      'Does it cost anything to get verified?',
      'Does it cost anything to get verified?',
    ],
  },
  {
    title: 'Account',
    items: [
      'Does it cost anything to get verified?',
      'Does it cost anything to get verified?',
      'Does it cost anything to get verified?',
      'Does it cost anything to get verified?',
    ],
  },
  {
    title: 'Resources',
    items: [
      'Does it cost anything to get verified?',
      'Does it cost anything to get verified?',
      'Does it cost anything to get verified?',
      'Does it cost anything to get verified?',
    ],
  },
];

const supportOptions = [
  { label: 'Contact support through chat' },
  { label: 'Create a support ticket in Discord' },
  { label: 'Email us at help@nemunekostudio.com' },
];

// ─── Small helpers ──────────────────────────────────────────────────────────

// Squiggly underline accent used under "BLOGS" and "Whats New!"
function Squiggle({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 14"
      preserveAspectRatio="none"
      className={`w-full h-3 ${className}`}
    >
      <path
        d="M2 8 C 20 2, 40 12, 60 7 S 100 2, 120 8 S 160 12, 198 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}


// ─── Main Component ─────────────────────────────────────────────────────────

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [blogPosts, setBlogPosts] = useState<IBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState<'Recent' | 'Oldest'>('Recent');
  const [sortOpen, setSortOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const postsResult = await getAllBlogPosts();
        if (postsResult.success) setBlogPosts(postsResult.data);
      } catch (error) {
        console.error('Error fetching blog data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPosts = blogPosts
    .filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.description &&
          post.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        activeCategory === 'All' ||
        (post as any).category?.toLowerCase() === activeCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const diff =
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortOrder === 'Recent' ? -diff : diff;
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleClick = (blogId: string) => {
    router.push(`/blog/${blogId}`);
  };

  const featuredPost = filteredPosts[0];
  const sidePosts = filteredPosts.slice(1, 4);
  const restPosts = filteredPosts.slice(4);
  const newsBatches = [restPosts.slice(0, 4), restPosts.slice(4, 8)].filter(
    (batch) => batch.length > 0
  );

  return (
    <div>

      {/* ── Hero + Search Section ── */}
      <section className="pt-16 sm:pt-30 pb-5 px-4 sm:px-6">
        <div className="container mx-auto">
          <div>
            <p className="text-2xl sm:text-3xl text-borsok text-primary">
              READ OUR
            </p>
            <h1 className="text-6xl sm:text-8xl leading-[0.9] text-borsok text-primary -mt-1">
              BLOGS
            </h1>
         
          </div>

          {/* Search + Category + Sort row */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mt-10">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
              <input
                type="text"
                placeholder="Search everything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full arial px-12 h-11 bg-white border-2 border-primary rounded-full text-primary placeholder-primary/40 focus:outline-none focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/50 hover:text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <button className="arial px-6 h-11 rounded-full border-2 border-primary text-primary whitespace-nowrap hover:bg-primary hover:text-white transition-colors">
              Category
            </button>

            <div className="flex flex-wrap gap-2">

              {categoryFilters.length > 1 && (
                <div className="flex items-center rounded-full border border-primary border-2 overflow-hidden bg-white shrink-0">
                  {categoryFilters.map((cat, idx) => {
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 h-9.5 text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${activeCategory === cat
                          ? 'bg-muted/80 text-primary'
                          : 'text-primary hover:bg-gray-50'
                          } ${idx !== categoryFilters.length - 1
                            ? 'border-r-2 border-primary'
                            : ''
                          }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:ml-auto flex items-center gap-2 relative">
              <span className="text-primary whitespace-nowrap">
                Sort by:
              </span>
              <button
                onClick={() => setSortOpen((o) => !o)}
                className="arial flex items-center gap-1 px-4 py-2 rounded-full border-0 text-primary font-semibold hover:border-primary transition-colors"
              >
                {sortOrder}
                <ChevronDown className="w-4 h-4" />
              </button>
              {sortOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white border-2 border-primary/20 rounded-2xl shadow-lg overflow-hidden z-20">
                  {(['Recent', 'Oldest'] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSortOrder(opt);
                        setSortOpen(false);
                      }}
                      className="block w-full text-left px-5 py-2 arial text-primary hover:bg-primary/10"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Posts (1 large + 3 side) ── */}
      <section className="pb-16 px-4 sm:px-6">
        <div className="container mx-auto">
          {loading ? (
            <SkeletonBlog />
          ) : !featuredPost ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-primary/40 mb-2">
                No posts found
              </h3>
              <p className="text-primary/30 arial">Try adjusting your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
              {/* Large featured card */}
              <div
                onClick={() => handleClick(featuredPost.id)}
                className="group cursor-pointer"
              >
                <CardDashed className="relative bg-white  rounded-3xl border-2 border-primary/20 shadow-md  h-full min-h-[420px]">
                  <div className="relative w-full h-full ">
                    {featuredPost.image ? (
                      <img
                        src={featuredPost.image}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover rounded-2xl  transition-transform duration-400 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        📝
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 p-8 w-full">
                      <Badge className="mb-4 py-2 px-4 arial text-white bg-muted">
                        EN VTubers
                      </Badge>
                      <h3 className="text-3xl text-arial text-white font-semibold">
                        {featuredPost.title}
                      </h3>
                      <p className="text-white/70 arial mt-3 text-sm">
                        by: <span className="font-semibold text-white">Nemuneko</span>{' '}
                        &nbsp;{formatDate(featuredPost.created_at)}
                      </p>
                    </div>
                  </div>
                </CardDashed>
              </div>

              {/* Side stacked cards */}
              <div className="flex flex-col gap-6">
                {sidePosts.map((post) => (
                  <div key={post.id} onClick={() => handleClick(post.id)} className=''>
                    <div
                      className=" cursor-pointer  gap-4 p-4 bg-white flex   rounded-3xl transition-shadow">
                      <div className="flex gap-10  w-full">
                        <CardDashed className='rounded-xl'>
                          <div className="relative w-28 sm:w-32 aspect-square rounded-[10px] overflow-hidden bg-gradient-to-br from-[#9B5DE0]/20 to-[#D78FEE]/20 shrink-0">
                            {post.image ? (
                              <img
                                src={post.image}
                                alt={post.title}
                                className="w-full h-full object-cover transition-transform duration-400 ease-out group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-3xl">
                                📝
                              </div>
                            )}
                          </div>
                        </CardDashed>
                        <div className="flex flex-col  justify-start">
                          <Badge className="mb-5 w-fit py-1 px-3 text-xs arial bg-muted text-white">
                            EN VTubers
                          </Badge>
                          <h4 className="text-arial font-semibold text-primary leading-snug line-clamp-2">
                            {post.title}
                          </h4>
                          <p className="arial text-primary/50 text-xs mt-2">
                            by: <span className="font-semibold text-primary/70">Nemuneko</span>{' '}
                            &nbsp;{formatDate(post.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Purple CTA banner ── */}
      <section className="pb-20 px-4 sm:px-6">
        <div className="container mx-auto">
          <Link href="/contact">
            <div className="bg-primary rounded-[30px] py-10 px-10 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer transition-transform duration-200 ease-out hover:scale-[1.01]">
              <h3 className="text-2xl sm:text-3xl text-borsok text-white text-center sm:text-left">
                Got an idea? Let's turn it into a commission.
              </h3>
              <Button
                size="lg"
                className="button-yellow cursor-pointer text-lg px-6 py-3 shrink-0"
              >
                GET STARTED <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </Link>
        </div>
      </section>

      {/* ── Whats New sections ── */}
      {newsBatches.map((batch, idx) => (
        <section key={idx} className="pb-16 px-4 sm:px-6">
          <div className="container mx-auto">
            <div className="mb-10">
              <h2 className="text-4xl text-borsok text-primary">Whats New!</h2>
              <div className="max-w-[170px] text-primary/70">
                {/* <Squiggle /> */}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {batch.map((post) => (
                <div
                  key={post.id}
                  onClick={() => handleClick(post.id)}
                  className="group cursor-pointer transition-transform duration-300 ease-out hover:-translate-y-1.5"
                >
                  <div className="relative">
                    <Badge className="absolute bg-secondary -top-3 left-4 z-10 py-2 px-4 arial text-white shadow-sm">
                      EN VTubers
                    </Badge>
                    <CardDashed className='rounded-3xl'>
                      <div className="relative aspect-square rounded-[15px] overflow-hidden ">
                        {post.image ? (
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-400 ease-out group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl">
                            📝
                          </div>
                        )}
                      </div>
                    </CardDashed>
                  </div>

                  <h3 className="text-xl text-arial font-semibold text-primary mt-4 leading-snug line-clamp-2">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="arial text-sm text-primary/60">
                      by: <span className="font-semibold text-primary">Nemuneko</span>
                    </span>
                    <span className="arial text-xs text-primary/60 border border-primary/20 rounded-full px-3 py-1">
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}


      {/* ── FAQ Section ── */}
      <section className="max-w-7xl w-full mx-auto">
        <hr className="bg-primary p-[1px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-10">
          {faqCategories.map((cat) => (
            <div key={cat.title} className="p-5 my-5">
              <h2 className="text-primary text-xl text-borsok mb-5">
                {cat.title}
              </h2>

              {cat.items.map((item, i) => (
                <h2
                  key={i}
                  className="text-primary/50 py-6 text-arial border-b-2 cursor-pointer transition-transform duration-200 ease-out hover:translate-x-1.5"
                >
                  {item}
                </h2>
              ))}
            </div>
          ))}
        </div>

        {/* Support CTA */}
        <div>
          <h1 className="text-center mx-auto md:text-4xl text-2xl text-primary text-borsok max-w-2xl">
            Have a specific issue with your account or commission?
          </h1>

          <div className="max-w-5xl mt-10 mx-auto flex flex-col gap-5 pb-16 px-10">
            {supportOptions.map((opt) => (
              <div
                key={opt.label}
                className="rounded-[20px] py-5 px-10 w-full bg-[#e6dcff] flex gap-3 items-center cursor-pointer transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.01] group"
              >
                <p className="arial flex-1">{opt.label}</p>
                <div className="transition-transform duration-200 ease-out group-hover:translate-x-1.5">
                  <ArrowRight className="text-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}