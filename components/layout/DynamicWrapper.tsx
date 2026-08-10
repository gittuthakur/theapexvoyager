import dynamic, { type Loader } from 'next/dynamic';
import type { ComponentType } from 'react';
import { SkeletonGrid } from '@/components/ui/Skeleton';

export interface DynamicWrapperOptions {
  ssr?: boolean;
  skeletonCount?: number;
}

export function createLazyModule<P extends object>(loader: Loader<P>, options: DynamicWrapperOptions = {}) {
  const { ssr = true, skeletonCount = 3 } = options;

  return dynamic(loader, {
    ssr,
    loading: () => <SkeletonGrid count={skeletonCount} />
  }) as ComponentType<P>;
}
