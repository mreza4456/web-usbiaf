import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from './ui/card';

// export function SkeletonGrid({
//   grid = 3,
//   cardCount = 4,
//   className = ""
// }) {
//   return (
//     <div
//       className={`grid gap-4 ${className}  `}
//       style={{
//         gridTemplateColumns: `repeat(${grid}, minmax(0, 1fr))`
//       }}
//     >
//       {Array.from({ length: cardCount }).map((_, index) => (
//         <div key={index} className="space-y-3 pulse bg-white rounded-lg border grid grid-cols-2 p-4 opacity-50">
//           <Skeleton className="h-full w-full rounded-md" />
//           <div className="space-y-2">
//             <Skeleton className="h-4 w-full" />
//             <Skeleton className="h-4 w-4/5" />
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

export default function SkeletonService() {
  return (
    <div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 opacity-70" >
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="flex w-full grid grid-cols-1 lg:grid-cols-2 gap-8 space-y-3  bg-white/50 rounded-md border p-4" key={i}>
            <Skeleton className="h-80 w-full flex-shrink-0" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="mt-auto flex items-center gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </div>
        ))
        }
      </div>

    </div>
  )
}
export function SkeletonProjects() {
  return (
    <div>


      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" >
        {Array.from({ length: 8 }).map((_, i) => (
          <div className="flex w-full max-w-sm flex-col gap-3 bg-white/50 p-3 rounded-lg" key={i}>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))
        }
      </div>

    </div>
  )
}
export function CheckoutSkeleton() {
  return (
<div className='w-full max-w-7xl'>
  <div className="flex justify-around mb-10">
     <Skeleton className="h-15 w-15 rounded-full bg-gray-200 opacity-20" />
     <Skeleton className="h-15 w-15 rounded-full bg-gray-200 opacity-20" />
     <Skeleton className="h-15 w-15 rounded-full bg-gray-200 opacity-20" />
     <Skeleton className="h-15 w-15 rounded-full bg-gray-200 opacity-20" />
  </div>
    <Card className="flex  bg-white/50 h-120 flex-col gap-6 p-5">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-10 w-32" />
    </Card>
</div>

  )
}
export function SkeletonCarts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className='md:col-span-2'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="grid grid-cols-4 items-center gap-3 rounded-md border p-3 bg-white/50 mb-5" key={i}>
            <Skeleton className="w-full h-40 flex-shrink-0 rounded-md" />
            <div className="flex flex-1 col-span-2 flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-8 flex-shrink-0 rounded-md" />
          </div>
        ))}
      </div>
      <Card className='bg-white/50 w-full h-80 shadow opacity-70'>
        <div className="flex flex-col p-5 space-y-2 gap-5 justify-between">

          <Skeleton className="h-20 w-full" />
          <div>
            <Skeleton className="h-8 w-full flex-shrink-0 rounded-full" />
            <Skeleton className="h-8 w-full flex-shrink-0 rounded-full" />
          </div>
          <Skeleton className="h-10 w-full rounded-md" />

        </div>

      </Card>
    </div>
  )
}


export function SkeletonBlog({ cardcount = 6 }) {
  return (
    <div>


      <div className="grid sm:grid-cols-2 lg:grid-cols-3  gap-5" >
        {Array.from({ length: cardcount }).map((_, i) => (
          <div className="flex w-full  flex-col gap-3 bg-white/50 overflow-hidden rounded-md border" key={i}>
            <Skeleton className="h-60 w-full rounded-none" />
            <div className="flex flex-col gap-3 p-4">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
              <div className="mt-2 flex items-center justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </div>
        ))
        }
      </div>

    </div>
  )
}


export function SkeletonServiceDetail() {
  return (
    <div className="min-h-screen bg-white/40 py-8 px-4 mt-20">
      <div className="max-w-7xl mx-auto">
        {/* Header Navigation Skeleton */}
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Image Gallery Skeleton */}
          <div className="space-y-4">
            {/* Main Image */}
            <Skeleton className="w-full aspect-[1/1] rounded-2xl" />

            {/* Thumbnail Images */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="flex-shrink-0 w-20 h-20 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Category Description Skeleton */}
          <div className="w-full mx-auto">
            <div className="flex flex-col justify-between items-center">
              <div className="space-y-6 w-full">
                <div>
                  {/* Title */}
                  <Skeleton className="h-10 w-3/4 mb-4 mt-5" />

                  {/* Description */}
                  <div className="space-y-3 py-8">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </div>

              {/* Price Section Skeleton */}
              <div className="py-5 w-full">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-9 w-32" />
              </div>

              {/* CTA Button Skeleton - Desktop Only */}
              <div className="mt-8 w-full">
                <Skeleton className="h-14 w-full rounded-full hidden md:block" />
              </div>
            </div>
          </div>
        </div>

        {/* How To Order Section Skeleton */}
        <div className="mt-20 p-5">
          <Skeleton className="h-8 w-48 mb-4" />
        </div>

        <section className="py-3 mb-20">
          <div className="relative">
            {/* Desktop Timeline Skeleton */}
            <div className="hidden md:flex justify-between items-start p-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col items-center flex-1 relative">
                  <div className="flex items-center w-full">
                    <div className="flex flex-col items-center z-10">
                      <Skeleton className="w-12 h-12 rounded-full my-3" />
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Timeline Skeleton */}
            <div className="md:hidden space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    {i < 4 && <Skeleton className="w-0.5 h-12 my-1" />}
                  </div>
                  <div className="flex-1 pb-4 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section Skeleton */}
        <Card className="bg-muted/50">
          <CardHeader>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Package Selection Skeleton - Mobile Only */}
        <div className="mt-8 md:hidden">
          <Skeleton className="h-8 w-56 mb-4" />
          <Skeleton className="h-5 w-72 mb-6" />

          <div className="grid grid-cols-1 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-white">
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-20 mb-2 rounded-full" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-9 w-32 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <Skeleton className="h-11 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen  py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Profile Header Card Skeleton */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar Skeleton */}
            <Skeleton className="w-32 h-32 rounded-full" />

            <div className="flex-1 text-center md:text-left space-y-4 w-full">
              {/* Name Skeleton */}
              <Skeleton className="h-8 w-48 mx-auto md:mx-0" />

              {/* Badges Skeleton */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>

            {/* Edit Button Skeleton */}
            <Skeleton className="h-9 w-28" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/50 backdrop-blur-sm rounded-xl shadow p-6 border border-white/20">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Profile Details Skeleton */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20">
          <Skeleton className="h-7 w-48 mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Vouchers Section Skeleton */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/50 rounded-xl p-4 border border-white/20">
                <div className="flex items-start justify-between mb-3">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-32 mb-3" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 w-9" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stamp Journey Skeleton */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-6 w-36" />
          </div>

          {/* Progress Section Skeleton */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
          </div>

          {/* Stamps Display Skeleton */}
          <div className="grid grid-cols-6 md:grid-cols-12 gap-3 mb-8">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="w-14 h-14 rounded-full" />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>

          {/* Milestone Goals Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-44 mb-4" />

            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/50 rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>

          {/* Info Messages Skeleton */}
          <div className="mt-6 space-y-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>

          {/* View All Orders Button Skeleton */}
          <Skeleton className="h-11 w-full md:w-48 mx-auto mt-6" />
        </div>
      </div>
    </div>
  );
}