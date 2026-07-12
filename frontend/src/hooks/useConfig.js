import { useQuery } from '@tanstack/react-query';
import { configService } from '../services/config.service.js';

export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: configService.getConfig,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
