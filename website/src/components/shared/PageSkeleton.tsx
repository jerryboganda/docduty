import { Skeleton } from "@/components/ui/skeleton";

const PageSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Navbar skeleton */}
    <div className="h-16 lg:h-20 bg-primary/50 backdrop-blur-xl border-b border-border/10 flex items-center px-6">
      <Skeleton className="w-32 h-8 bg-muted/20" />
      <div className="flex-1" />
      <div className="hidden lg:flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="w-20 h-5 bg-muted/20" />
        ))}
      </div>
    </div>

    {/* Hero skeleton */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <Skeleton className="w-48 h-8 rounded-full" />
          <Skeleton className="w-full h-14" />
          <Skeleton className="w-3/4 h-14" />
          <Skeleton className="w-full h-6 mt-4" />
          <Skeleton className="w-2/3 h-6" />
          <div className="flex gap-4 mt-8">
            <Skeleton className="w-36 h-12 rounded-lg" />
            <Skeleton className="w-40 h-12 rounded-lg" />
          </div>
        </div>
        <div className="hidden lg:flex flex-col gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-28 rounded-xl" />
          ))}
        </div>
      </div>
    </div>

    {/* Section skeletons */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-4">
      <Skeleton className="w-64 h-8 mx-auto" />
      <Skeleton className="w-96 h-5 mx-auto" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

export default PageSkeleton;
