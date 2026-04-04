import { getAllDrivers, isDriverAvailable } from '../lib/workflows/media-drivers/registry';
import { loadConfigEnv } from '../lib/workflows/media-drivers/utils';

export interface DurationConstraintsInfo {
  minSeconds: number;
  maxSeconds: number;
  defaultSeconds: number;
  stepSeconds?: number;
}

export interface MediaDriverInfo {
  slug: string;
  displayName: string;
  mediaType: 'image' | 'video' | 'audio';
  requiredEnvVars: string[];
  available: boolean;
  missingEnvVars: string[];
  durationConstraints: DurationConstraintsInfo | null;
}

/**
 * List all known media drivers with availability status.
 */
export async function handleMediaDriversList(): Promise<MediaDriverInfo[]> {
  const configEnv = await loadConfigEnv();

  // Merge process.env (strings only) with config env vars
  const mergedEnv: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === 'string') mergedEnv[k] = v;
  }
  Object.assign(mergedEnv, configEnv);

  return getAllDrivers().map((driver) => {
    const available = isDriverAvailable(driver.slug, mergedEnv);
    const missing = driver.requiredEnvVars.filter(
      (v) => !mergedEnv[v] || mergedEnv[v].trim().length === 0
    );
    return {
      slug: driver.slug,
      displayName: driver.displayName,
      mediaType: driver.mediaType,
      requiredEnvVars: driver.requiredEnvVars,
      available,
      missingEnvVars: missing,
      durationConstraints: driver.durationConstraints ?? null,
    };
  });
}
