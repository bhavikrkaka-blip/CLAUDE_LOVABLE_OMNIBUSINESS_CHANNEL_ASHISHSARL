import { Skeleton } from "@/components/ui/skeleton";

export const ProductCardSkeleton = () => (
  <div className="group relative overflow-hidden rounded-lg bg-card border border-border animate-pulse">
    <div className="aspect-square bg-muted" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-6 w-24" />
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export const HeroProductSkeleton = () => (
  <div className="relative overflow-hidden rounded-lg bg-card border border-border animate-pulse">
    <div className="aspect-square bg-muted" />
    <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
      <Skeleton className="h-4 w-20 bg-white/20" />
      <Skeleton className="h-8 w-3/4 bg-white/20" />
      <Skeleton className="h-6 w-32 bg-white/20" />
    </div>
  </div>
);

export const ProductDetailSkeleton = () => (
  <div className="grid md:grid-cols-2 gap-8 animate-pulse">
    <div className="aspect-square bg-muted rounded-lg" />
    <div className="space-y-6">
      <div>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4 mt-2" />
      </div>
      <Skeleton className="h-8 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-12 w-40" />
        <Skeleton className="h-12 w-12" />
      </div>
    </div>
  </div>
);
