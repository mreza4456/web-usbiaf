"use client";

import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getAllBlogPosts } from '@/action/blog';
import { IBlogPost } from '@/interface';
import { SkeletonBlog } from '@/components/skeleton-card';
import { Textstyle, Textstylegreen } from '@/components/font-design';

import { useRouter } from 'next/navigation';

// ─── FAQ categories data ───────────────────────────────────────────────────────

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

// ─── Main Component ────────────────────────────────────────────────────────────

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [blogPosts, setBlogPosts] = useState<IBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
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

  const filteredPosts = blogPosts.filter(post => {
    return (
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.description && post.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleClick = (blogId: string) => {
    router.push(`/blog/${blogId}`);
  };

  return (
    <div>
      <div className="relative z-10">

        {/* ── Hero Section ── */}
        <section className="pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 bg-[#e6dcff]">
          <div className="container mx-auto text-center pt-10">
            <div>
              <div className="flex gap-5 justify-center  w-full mb-4 mt-15">
                <Textstyle Title="FIND" className="text-4xl sm:text-7xl w-full " color="text-purple" />
                <Textstyle Title="OUR" className="text-4xl sm:text-7xl w-full" color="text-yellow" />
                <Textstylegreen Title="SERVICES" className="text-4xl sm:text-7xl w-full" color="text-green" />
              </div>
            </div>
            <div className="text-center mx-auto  max-w-3xl ">
              <p className="text-lg md:text-xl  arial">
                Explore our collection and portofolio and browse for your reffrences
              </p>
            </div>
            {/* Search Bar */}
            <div className="max-w-xl mx-auto my-10 mb-20 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary w-5 h-5" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className=" w-full text-arial px-12  py-2 bg-white/5 border border-primary border-3 rounded-full text-primary placeholder-gray-400 focus:outline-none focus:border-primary/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

          </div>
        </section>

        {/* ── Blog Posts Grid ── */}
        <section className="py-20 px-4 sm:px-6">
          <div className="container mx-auto">

            <div className="flex flex-col-reverse md:flex-row items-center justify-between mb-8 ">
              <Button className='px-7 py-5 cursor-pointer rounded-full bg-white border-primary border-4 arial '>
                About Nemuneko
              </Button>
              <h5 className='text-2xl max-w-xl text-arial text-end text-primary'>Nemuneko Studio is a group of 7 Talented
                VArtist base on South East Asia we love
                creating creativity and joy our life.</h5>
            </div>

            {loading ? (
              <SkeletonBlog />
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-2xl font-bold text-gray-400 mb-2">No posts found</h3>
                <p className="text-gray-500">Try adjusting your search</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
                {filteredPosts.map((post) => {
                  const formattedDate = formatDate(post.created_at);

                  return (
                    <div
                      key={post.id}
                      className="group transition-transform duration-300 ease-out hover:-translate-y-1.5"
                      onClick={() => handleClick(post.id)}
                    >
                      <Card className="bg-white cursor-pointer relative p-0 rounded-[50px] shadow-lg  transition-colors duration-300 overflow-hidden h-full flex flex-col">

                        {/* Image */}
                        <div className="relative aspect-5/6 bg-gradient-to-br from-[#9B5DE0]/20 to-[#D78FEE]/20 overflow-hidden">
                          {post.image ? (
                            <img
                              src={post.image}
                              alt={post.title}
                              className="w-full h-full object-cover transition-transform duration-400 ease-out group-hover:scale-105"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-6xl">
                              📝
                            </div>
                          )}
                        </div>
                        <div className="absolute w-full h-full bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div className="absolute bottom-0 h-1/2 p-7 left-0 text-start z-5">
                          <div className="flex flex-col gap-5 justify-between">
                            <h3 className='text-3xl text-arial text-white'>
                              {post.title}
                            </h3>
                            <div className="flex gap-3 mb-5">
                              <Badge className='py-2 px-4 text-arial text-white'>YCH</Badge>
                              <Badge className='text-arial py-2 px-4 text-white'>EMOTES</Badge>
                            </div>
                          </div>
                        </div>

                      </Card>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </section>

        {/* ── Newsletter CTA ── */}
        <section className="pb-20 px-4 sm:px-6">
          <div className="container mx-auto">
            <div className="bg-transparent shadow-0 border-0">
              <div className="text-center py-12 sm:py-16 px-4 sm:px-6">
                <h2 className="text-3xl text-borsok sm:text-4xl md:text-5xl text-primary font-bold mb-4 sm:mb-6">
                  Can't Find What You're Looking For?
                </h2>
                <p className="text-gray-800 text-arial text-primary/50 sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
                  Contact us to make custom project to fit with your request and personalized
                </p>
                <div className=" sm:flex-row gap-3 max-w-md mx-auto">
                  <div className="inline-block transition-transform duration-200 ease-out hover:scale-105 active:scale-95">
                    <Link href="/contact">
                      <Button size="lg" className="button-yellow cursor-pointer text-xl px-6 py-3">
                        CONTACT US
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className='bg-primary p-[1px]' />

        {/* ── FAQ Section ── */}
        <section className='max-w-7xl w-full mx-auto'>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-10">
            {faqCategories.map((cat) => (
              <div key={cat.title} className='p-5 my-5'>
                {/* Category title */}
                <h2 className="text-primary text-xl text-borsok mb-5">
                  {cat.title}
                </h2>

                {/* FAQ items */}
                {cat.items.map((item, i) => (
                  <h2
                    key={i}
                    className='text-primary/50 py-6 text-arial border-b-2 cursor-pointer transition-transform duration-200 ease-out hover:translate-x-1.5'
                  >
                    {item}
                  </h2>
                ))}
              </div>
            ))}
          </div>

          {/* Support CTA */}
          <div>
            <h1 className='text-center mx-auto md:text-4xl text-2xl text-primary text-borsok max-w-2xl'>
              Have a specific issue with your account or commission?
            </h1>

            <div className="max-w-5xl mt-10 mx-auto flex flex-col gap-5 pb-16 px-10">
              {supportOptions.map((opt) => (
                <div
                  key={opt.label}
                  className="rounded-[20px] py-5 px-10 w-full bg-[#e6dcff] flex gap-3 items-center cursor-pointer transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.01] group"
                >
                  <p className='arial flex-1'>{opt.label}</p>
                  <div className="transition-transform duration-200 ease-out group-hover:translate-x-1.5">
                    <ArrowRight className='text-primary' />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}