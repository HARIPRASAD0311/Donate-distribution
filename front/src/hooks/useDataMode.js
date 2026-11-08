import { useAppStore } from '../store/useAppStore.js';
import { DEMO_CONFIG } from '../mock-data/config.js';

/**
 * Hook to provide current data mode status and utilities.
 */
export function useDataMode() {
  const isDemoMode = useAppStore((state) => state.isDemoMode);
  return {
    isDemoMode,
    watermark: DEMO_CONFIG.demoWatermark,
    simulatedTimestamp: DEMO_CONFIG.simulatedTimestamp,
  };
}
