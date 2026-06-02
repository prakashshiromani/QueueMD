import React from 'react';

export default function StaffSkeleton() {
  return (
    <div className="bg-bg-secondary border border-border-muted/50 rounded-2xl p-6 animate-pulse shadow-sm">
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-border-muted" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-border-muted rounded" />
            <div className="h-3 w-16 bg-border-muted rounded" />
          </div>
        </div>
        <div className="h-5 w-14 bg-border-muted rounded-lg" />
      </div>
      <div className="space-y-3 mb-6">
        <div className="h-3 w-3/4 bg-border-muted rounded" />
        <div className="h-3 w-1/2 bg-border-muted rounded" />
      </div>
      <div className="flex gap-3 pt-4 border-t border-border-muted/30">
        <div className="flex-1 h-10 bg-border-muted rounded-xl" />
        <div className="flex-1 h-10 bg-border-muted rounded-xl" />
      </div>
    </div>
  );
}
