import React from "react";
import { cn } from "../../lib/utils";

// Base shimmer animation block
const Shimmer = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "animate-pulse rounded-xl bg-accent/60",
      className
    )}
  />
);

// ─── Profile Header Skeleton ────────────────────────────────────────────────
export const ProfileHeaderSkeleton = () => (
  <div className="w-full relative z-10 border-b border-border/40 bg-card/40">
    {/* Banner */}
    <div className="h-40 md:h-52 w-full bg-accent/40 animate-pulse" />
    {/* Identity bar */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative flex flex-col sm:flex-row sm:items-end justify-between pb-6 -mt-16 md:-mt-20 z-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
          {/* Avatar */}
          <Shimmer className="w-32 h-32 md:w-40 md:h-40 rounded-[1.5rem] border-[4px] border-background flex-shrink-0" />
          {/* Name + role */}
          <div className="pt-3 sm:pt-0 pb-2 space-y-3">
            <Shimmer className="h-7 w-48 rounded-lg" />
            <Shimmer className="h-4 w-36 rounded-lg" />
          </div>
        </div>
        {/* Action buttons */}
        <div className="mt-6 sm:mt-0 flex gap-3">
          <Shimmer className="h-10 w-28 rounded-xl" />
          <Shimmer className="h-10 w-24 rounded-xl hidden sm:block" />
        </div>
      </div>
    </div>
  </div>
);

// ─── Sidebar Card Skeleton ──────────────────────────────────────────────────
export const SidebarCardSkeleton = () => (
  <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
    <Shimmer className="h-3 w-16 rounded" />
    <div className="space-y-3">
      <Shimmer className="h-4 w-full rounded" />
      <Shimmer className="h-4 w-4/5 rounded" />
      <Shimmer className="h-4 w-3/5 rounded" />
    </div>
    <div className="pt-4 border-t border-border/40 space-y-4">
      <div className="flex items-center gap-3">
        <Shimmer className="w-4 h-4 rounded-full" />
        <Shimmer className="h-3 w-28 rounded" />
      </div>
      <div className="flex items-center gap-3">
        <Shimmer className="w-4 h-4 rounded-full" />
        <Shimmer className="h-3 w-24 rounded" />
      </div>
    </div>
  </div>
);

// ─── Metrics Card Skeleton ──────────────────────────────────────────────────
export const MetricsCardSkeleton = () => (
  <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
    <Shimmer className="h-3 w-28 rounded" />
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col items-center p-4 rounded-xl border border-border/40 space-y-2">
        <Shimmer className="h-7 w-10 rounded" />
        <Shimmer className="h-2 w-14 rounded" />
      </div>
      <div className="flex flex-col items-center p-4 rounded-xl border border-border/40 space-y-2">
        <Shimmer className="h-7 w-10 rounded" />
        <Shimmer className="h-2 w-14 rounded" />
      </div>
    </div>
    <div className="pt-4 border-t border-border/40 space-y-5">
      <div className="space-y-2">
        <div className="flex justify-between">
          <Shimmer className="h-3 w-24 rounded" />
          <Shimmer className="h-3 w-6 rounded" />
        </div>
        <Shimmer className="h-1.5 w-full rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Shimmer className="h-3 w-20 rounded" />
          <Shimmer className="h-3 w-6 rounded" />
        </div>
        <Shimmer className="h-1.5 w-full rounded-full" />
      </div>
    </div>
  </div>
);

// ─── Post Skeleton (Shimmer Feed Card) ──────────────────────────────────────
export const PostSkeleton = () => (
  <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
    <div className="p-5 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shimmer className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <Shimmer className="h-4 w-32 rounded" />
          <Shimmer className="h-3 w-24 rounded" />
        </div>
      </div>
      {/* Content lines */}
      <div className="space-y-2 pt-1">
        <Shimmer className="h-4 w-full rounded" />
        <Shimmer className="h-4 w-5/6 rounded" />
        <Shimmer className="h-4 w-3/4 rounded" />
      </div>
      {/* Action bar */}
      <div className="flex items-center gap-4 pt-3 border-t border-border/40">
        <Shimmer className="h-8 w-16 rounded-lg" />
        <Shimmer className="h-8 w-16 rounded-lg" />
        <Shimmer className="h-8 w-16 rounded-lg ml-auto" />
      </div>
    </div>
  </div>
);

// ─── Comment Skeleton ───────────────────────────────────────────────────────
export const CommentSkeleton = () => (
  <div className="flex gap-3 py-3">
    <Shimmer className="w-8 h-8 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <Shimmer className="h-3 w-24 rounded" />
      <Shimmer className="h-3 w-full rounded" />
      <Shimmer className="h-3 w-2/3 rounded" />
    </div>
  </div>
);

// ─── Composer Skeleton ──────────────────────────────────────────────────────
export const ComposerSkeleton = () => (
  <div className="bg-card border border-border/60 p-4 md:p-5 rounded-2xl shadow-sm">
    <div className="flex gap-4">
      <Shimmer className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <Shimmer className="h-11 w-full rounded-xl" />
        <div className="flex justify-between">
          <div className="flex gap-2">
            <Shimmer className="h-7 w-16 rounded-lg" />
            <Shimmer className="h-7 w-16 rounded-lg" />
          </div>
          <Shimmer className="h-7 w-14 rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);

// ─── Feed Skeleton (multiple post cards) ────────────────────────────────────
export const FeedSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-5">
    {Array.from({ length: count }).map((_, i) => (
      <PostSkeleton key={i} />
    ))}
  </div>
);

// ─── Full Profile Page Skeleton ─────────────────────────────────────────────
export const FullProfileSkeleton = () => (
  <>
    <ProfileHeaderSkeleton />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-32 grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 flex flex-col gap-6">
        <SidebarCardSkeleton />
        <MetricsCardSkeleton />
      </div>
      <div className="lg:col-span-8 flex flex-col gap-6">
        <ComposerSkeleton />
        <FeedSkeleton count={3} />
      </div>
    </div>
  </>
);
