import React from 'react';

export const ProductGridSkeleton: React.FC = () => {
  return (
    <div className="py-20 sm:py-28">
      <div className="flex items-center justify-between mb-12 pb-6 border-b border-white/[0.08] animate-pulse">
        <div className="h-6 w-48 bg-stone-900" />
        <div className="h-8 w-60 bg-stone-900" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col bg-[#0e0e11] border border-white/[0.07] overflow-hidden animate-pulse"
          >
            {/* Image Placeholder */}
            <div className="aspect-[4/5] w-full bg-stone-900" />

            {/* Content Placeholders */}
            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="h-2.5 w-16 bg-stone-900" />
                <div className="h-4 w-3/4 bg-stone-900" />
                <div className="h-3 w-full bg-stone-900/60" />
              </div>

              <div className="pt-3 border-t border-white/[0.07] flex items-center justify-between">
                <div className="h-5 w-14 bg-stone-900" />
                <div className="h-7 w-20 bg-stone-900" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
