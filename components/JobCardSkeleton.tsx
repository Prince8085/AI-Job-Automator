import React from 'react';

const JobCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-slate-200">
      <div className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-200 rounded"></div>
            <div className="h-3 bg-slate-200 rounded w-5/6"></div>
          </div>
        </div>
        <div className="rounded-full bg-slate-200 h-12 w-12"></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 animate-pulse">
        <div className="h-5 bg-slate-200 rounded-full w-20"></div>
        <div className="h-5 bg-slate-200 rounded-full w-24"></div>
        <div className="h-5 bg-slate-200 rounded-full w-16"></div>
      </div>
       <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm text-text-secondary animate-pulse">
          <div className="h-3 bg-slate-200 rounded w-1/4"></div>
          <div className="h-3 bg-slate-200 rounded w-1/3"></div>
      </div>
    </div>
  );
};

export default JobCardSkeleton;
