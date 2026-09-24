import React from 'react';

export const ProductGridSkeleton: React.FC = () => {
  return (
    <div className="py-12">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800 animate-pulse">
        <div className="h-8 w-48 bg-slate-800/80 rounded-xl" />
        <div className="h-10 w-64 bg-slate-800/80 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col bg-slate-900/50 rounded-2xl border border-slate-800/80 overflow-hidden animate-pulse"
          >
            {/* Image Placeholder */}
            <div className="aspect-square w-full bg-slate-800/60" />

            {/* Content Placeholders */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="h-3 w-20 bg-slate-800 rounded" />
                <div className="h-4 w-3/4 bg-slate-800 rounded" />
                <div className="h-3 w-full bg-slate-800/60 rounded" />
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <div className="h-5 w-16 bg-slate-800 rounded" />
                <div className="h-8 w-24 bg-slate-800 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
