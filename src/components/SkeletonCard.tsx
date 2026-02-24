import React from 'react';

export function SkeletonCard() {
  return (
    <div className="w-full flex flex-col gap-2 px-3 py-3 rounded-xl border border-transparent bg-white">
      <div className="flex items-start gap-3 w-full">
        <div className="w-16 h-16 rounded-lg bg-gray-200 animate-pulse flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
