import { useQuery } from '@tanstack/react-query';

export function useCachedQuery<T>(
  key: string[],
  fetchFn: () => Promise<T>,
  fallback: T,
  staleTime = 30_000,
) {
  return useQuery<T>({
    queryKey: key,
    queryFn: async () => {
      try {
        return await fetchFn();
      } catch {
        return fallback;
      }
    },
    staleTime,
    retry: 1,
  });
}
