import { MediaDriver } from './types';
import { NanoBananaPro } from './nano-banana-pro.driver';
import { OpenAIImageGen } from './openai-image-gen.driver';
import { RunwayVideo } from './runway-video.driver';
import { KlingVideo } from './kling-video.driver';
import { LumaVideo } from './luma-video.driver';
import { GenericDriver } from './generic.driver';

// Registry of known drivers
const knownDrivers: MediaDriver[] = [
  new NanoBananaPro(),
  new OpenAIImageGen(),
  new RunwayVideo(),
  new KlingVideo(),
  new LumaVideo(),
];

// Cache for discovered generic drivers
const genericDriverCache = new Map<string, MediaDriver | null>();

/**
 * Get a driver by slug
 */
export function getDriver(slug: string): MediaDriver | undefined {
  // First check known drivers
  const knownDriver = knownDrivers.find(d => d.slug === slug);
  if (knownDriver) {
    return knownDriver;
  }

  // Check cache for generic drivers
  if (genericDriverCache.has(slug)) {
    const cached = genericDriverCache.get(slug);
    return cached || undefined;
  }

  // Try to create a generic driver
  let genericDriver: MediaDriver | null = null;
  try {
    // Use sync approach since we need this to be synchronous for the registry
    // The actual skill discovery will be done lazily
    genericDriver = new GenericDriver(slug, 'image', `Generic driver for ${slug}`);
    genericDriverCache.set(slug, genericDriver);
    return genericDriver;
  } catch {
    genericDriverCache.set(slug, null);
    return undefined;
  }
}

/**
 * Get all drivers that produce a specific media type
 */
export function getDriversByType(mediaType: 'image' | 'video' | 'audio'): MediaDriver[] {
  return knownDrivers.filter(d => d.mediaType === mediaType);
}

/**
 * Get all known drivers (does not include auto-discovered generic drivers)
 */
export function getAllDrivers(): MediaDriver[] {
  return [...knownDrivers];
}

/**
 * Check if a driver is available (has required environment variables)
 */
export function isDriverAvailable(slug: string, env: Record<string, string>): boolean {
  const driver = getDriver(slug);
  if (!driver) {
    return false;
  }

  // Check if all required environment variables are present
  return driver.requiredEnvVars.every(envVar => {
    const value = env[envVar];
    return value && typeof value === 'string' && value.trim().length > 0;
  });
}

/**
 * Get drivers available with the current environment
 */
export function getAvailableDrivers(env: Record<string, string>): MediaDriver[] {
  return knownDrivers.filter(driver => isDriverAvailable(driver.slug, env));
}

/**
 * Get available drivers by media type
 */
export function getAvailableDriversByType(
  mediaType: 'image' | 'video' | 'audio',
  env: Record<string, string>
): MediaDriver[] {
  return getDriversByType(mediaType).filter(driver => isDriverAvailable(driver.slug, env));
}