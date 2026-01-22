import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SkeletonGrid({
  grid = 3,
  cardCount = 4,
  className = ""
}) {
  return (
    <div
      className={`grid gap-4 ${className}  `}
      style={{
        gridTemplateColumns: `repeat(${grid}, minmax(0, 1fr))`
      }}
    >
      {Array.from({ length: cardCount }).map((_, index) => (
        <div key={index} className="space-y-3 pulse bg-white rounded-lg border grid grid-cols-2 p-4 opacity-50">
          <Skeleton className="h-full w-full rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
