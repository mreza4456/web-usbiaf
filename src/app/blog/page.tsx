"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getAllBlogPosts } from '@/action/blog';
import { IBlogPost } from '@/interface';
import { SkeletonBlog } from '@/components/skeleton-card';
import { Textstyle, Textstylegreen } from '@/components/font-design';
import { useRouter } from 'next/navigation';

// ─── Animation Variants ────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay: i * 0.1 },
  }),
};

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

// ─── AnimateWhenVisible ────────────────────────────────────────────────────────

function AnimateWhenVisible({
  children,
  variants = fadeUp,
  custom,
  className = '',
}: {
  children: React.ReactNode;
  variants?: Variants;
  custom?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      variants={variants}
      custom={custom}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── StaggerContainer ─────────────────────────────────────────────────────────

function StaggerContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{
        visible: { transition: { staggerChildren: 0.12 } },
        hidden: {},
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div className="flex gap-5 justify-center  w-full mb-4 mt-15">
                <Textstyle Title="FIND" className="text-4xl sm:text-7xl w-full " color="text-purple" />
                <Textstyle Title="OUR" className="text-4xl sm:text-7xl w-full" color="text-yellow" />
                <Textstylegreen Title="SERVICES" className="text-4xl sm:text-7xl w-full" color="text-green" />
              </div>
            </motion.div>
            <div className="text-center mx-auto  max-w-3xl ">
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                className="text-lg md:text-xl  arial"
              >
                Explore our collection and portofolio and browse for your reffrences
              </motion.p>
            </div>
            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
              className="max-w-xl mx-auto my-10 mb-20 relative"
            >
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
            </motion.div>

          </div>
        </section>

        {/* ── Blog Posts Grid ── */}
        <section className="py-20 px-4 sm:px-6">
          <div className="container mx-auto">

            <AnimateWhenVisible className="flex items-center justify-between mb-8">
              <Button className='px-7 py-5 cursor-pointer rounded-full bg-white border-primary border-4 arial'>
                About Nemuneko
              </Button>
              <h5 className='text-2xl max-w-xl text-arial text-end text-primary'>Nemuneko Studio is a group of 7 Talented
                VArtist base on South East Asia we love
                creating creativity and joy our life.</h5>
            </AnimateWhenVisible>

            {loading ? (
              <SkeletonBlog />
            ) : filteredPosts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center py-20"
              >
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-2xl font-bold text-gray-400 mb-2">No posts found</h3>
                <p className="text-gray-500">Try adjusting your search</p>
              </motion.div>
            ) : (
              <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
                {filteredPosts.map((post, index) => {
                  const formattedDate = formatDate(post.created_at);

                  return (
                    <motion.div
                      key={post.id}
                      variants={fadeUp}
                      custom={index % 6}
                      whileHover={{ y: -6 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="group"
                      onClick={() => handleClick(post.id)}
                    >
                      <Card className="bg-white cursor-pointer relative p-0 rounded-[50px] shadow-lg  transition-colors duration-300 overflow-hidden h-full flex flex-col">

                        {/* Image */}
                        <div className="relative aspect-5/6 bg-gradient-to-br from-[#9B5DE0]/20 to-[#D78FEE]/20 overflow-hidden">
                          {post.image ? (
                            <motion.img
                              src={post.image}
                              alt={post.title}
                              className="w-full h-full object-cover"
                              transition={{ duration: 0.4, ease: 'easeOut' }}
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
                    </motion.div>
                  );
                })}
              </StaggerContainer>
            )}

          </div>
        </section>

        {/* ── Newsletter CTA ── */}
        <section className="pb-20 px-4 sm:px-6">
          <div className="container mx-auto">
            <AnimateWhenVisible variants={scaleIn}>
              <div className="bg-transparent shadow-0 border-0">
                <div className="text-center py-12 sm:py-16 px-4 sm:px-6">
                  <h2 className="text-3xl text-borsok sm:text-4xl md:text-5xl text-primary font-bold mb-4 sm:mb-6">
                    Can't Find What You're Looking For?
                  </h2>
                  <p className="text-gray-800 text-arial text-primary/50 sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
                    Contact us to make custom project to fit with your request and personalized
                  </p>
                  <div className=" sm:flex-row gap-3 max-w-md mx-auto">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                      <Link href="/contact">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                          <Button size="lg" className="button-yellow cursor-pointer text-xl px-6 py-3">
                            CONTACT US
                          </Button>
                        </motion.div>
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </div>
            </AnimateWhenVisible>
          </div>
        </section>

        <hr className='bg-primary p-[1px]' />

        {/* ── FAQ Section ── */}
        <section className='max-w-7xl w-full mx-auto'>
          <div className="grid grid-cols-3 p-10">
            {faqCategories.map((cat) => (
              <StaggerContainer key={cat.title} className='p-5 my-5'>
                {/* Category title */}
                <motion.h2
                  variants={fadeUp}
                  className="text-primary text-xl text-borsok mb-5"
                >
                  {cat.title}
                </motion.h2>

                {/* FAQ items */}
                {cat.items.map((item, i) => (
                  <motion.h2
                    key={i}
                    variants={fadeIn}
                    whileHover={{ x: 6 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    className='text-primary/50 py-6 text-arial border-b-2 cursor-pointer'
                  >
                    {item}
                  </motion.h2>
                ))}
              </StaggerContainer>
            ))}
          </div>

          {/* Support CTA */}
          <div>
            <AnimateWhenVisible>
              <h1 className='text-center mx-auto text-4xl text-primary text-borsok max-w-2xl'>
                Have a specific issue with your account or commission?
              </h1>
            </AnimateWhenVisible>

            <StaggerContainer className="max-w-5xl mt-10 mx-auto flex flex-col gap-5 pb-16">
              {supportOptions.map((opt) => (
                <motion.div
                  key={opt.label}
                  variants={fadeUp}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="rounded-[20px] py-5 px-10 w-full bg-[#e6dcff] flex gap-3 items-center cursor-pointer"
                >
                  <p className='arial flex-1'>{opt.label}</p>
                  <motion.div
                    whileHover={{ x: 5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <ArrowRight className='text-primary' />
                  </motion.div>
                </motion.div>
              ))}
            </StaggerContainer>
          </div>
        </section>

      </div>
    </div>
  );
}