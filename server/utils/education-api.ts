const BASE_URL = "https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets";

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 500; // ms

interface ApiResponse<T> {
  total_count: number;
  results: T[];
}

/**
 * Fetch a URL with retry + exponential backoff.
 * Retries up to MAX_RETRIES times on transient failures.
 */
async function fetchWithRetry(url: string): Promise<ApiResponse<unknown>> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await $fetch<ApiResponse<unknown>>(url);
    } catch (err) {
      if (attempt === MAX_RETRIES)
        throw err;
      const delay = attempt * RETRY_BASE_DELAY;
      console.warn(`[education-api] Attempt ${attempt}/${MAX_RETRIES} failed for ${url.split("?")[0]}, retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  // Unreachable — the loop always throws on the last attempt
  throw new Error("[education-api] fetchWithRetry: unreachable");
}

/**
 * Paginate through an OpenDataSoft v2.1 dataset and return all records.
 *
 * - `total_count` is locked from the first response to avoid mid-pagination
 *   fluctuations causing the loop to exit early.
 * - Every page request is retried up to MAX_RETRIES times.
 */
export async function fetchAllRecords<T>(
  datasetId: string,
  options: {
    where?: string;
    select?: string;
    limit?: number;
  } = {},
): Promise<T[]> {
  const limit = options.limit ?? 100;
  const allRecords: T[] = [];
  let offset = 0;
  let totalCount = Infinity;
  let totalCountLocked = false;

  while (offset < totalCount) {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });

    if (options.where)
      params.set("where", options.where);
    if (options.select)
      params.set("select", options.select);

    const url = `${BASE_URL}/${datasetId}/records?${params}`;
    const response = await fetchWithRetry(url);

    // Lock total_count from the first response to prevent
    // the loop from exiting early if the API reports a fluctuating count
    if (!totalCountLocked) {
      totalCount = response.total_count;
      totalCountLocked = true;
      console.warn(`[education-api] ${datasetId}: total_count=${totalCount}`);
    }

    allRecords.push(...response.results as T[]);
    offset += limit;
  }

  console.warn(`[education-api] ${datasetId}: fetched ${allRecords.length} records`);
  return allRecords;
}
