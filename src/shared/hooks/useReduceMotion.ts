import { useAppStore } from '@/core/stores/appStore';

/**
 * Returns the reduce-motion preference from appStore.
 * Components use this to conditionally skip breathing/drift animations.
 */
export function useReduceMotion(): boolean {
  return useAppStore((s) => s.reduceMotion);
}
