import type { DatasetConfig } from "~/config/dataset";
import { getDatasetConfig } from "~/config/dataset";

/**
 * Returns the active dataset configuration based on runtimeConfig.
 * The dataset is set at build time via the NUXT_PUBLIC_DATASET env var.
 */
export function useDataset(): DatasetConfig {
  const config = useRuntimeConfig();
  return getDatasetConfig(config.public.dataset as string);
}
