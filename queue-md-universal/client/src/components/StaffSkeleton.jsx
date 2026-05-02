import React from 'react';

export default function StaffSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 animate-pulse">
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-white/10 rounded" />
            <div className="h-3 w-16 bg-white/10 rounded" />
          </div>
        </div>
        <div className="h-5 w-14 bg-white/10 rounded-lg" />
      </div>
      <div className="space-y-3 mb-6">
        <div className="h-3 w-3/4 bg-white/10 rounded" />
        <div className="h-3 w-1/2 bg-white/10 rounded" />
      </div>
      <div className="flex gap-3 pt-4 border-t border-white/10">
        <div className="flex-1 h-10 bg-white/10 rounded-xl" />
        <div className="flex-1 h-10 bg-white/10 rounded-xl" />
      </div>
    </div>
  );
}
