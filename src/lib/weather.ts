/**
 * Weather Type Utilities
 *
 * Provides type conversions and mappings for weather conditions
 */

import type { WeatherCondition } from '@/types/weather';

/**
 * Weather condition metadata
 */
export const CONDITION_METADATA: Record<WeatherCondition, {
  label: string;
  description: string;
  emoji: string;
  index: number;
}> = {
  sunny: {
    label: 'Sunny',
    description: 'Clear skies',
    emoji: '☀️',
    index: 0,
  },
  rainy: {
    label: 'Rainy',
    description: 'Precipitation',
    emoji: '🌧️',
    index: 1,
  },
  snowy: {
    label: 'Snowy',
    description: 'Snowfall',
    emoji: '❄️',
    index: 2,
  },
  cloudy: {
    label: 'Cloudy',
    description: 'Overcast',
    emoji: '☁️',
    index: 3,
  },
};

/**
 * Weather condition display order
 */
export const WEATHER_CONDITION_ORDER: WeatherCondition[] = ['sunny', 'rainy', 'snowy', 'cloudy'];

/**
 * Convert weather condition string to contract index
 *
 * @param condition - Weather condition name
 * @returns number - Index for contract (0-3)
 */
export function conditionToIndex(condition: WeatherCondition): number {
  return CONDITION_METADATA[condition].index;
}

/**
 * Convert contract index to weather condition string
 *
 * @param index - Contract index (0-3)
 * @returns WeatherCondition - Weather condition name
 */
export function indexToCondition(index: number): WeatherCondition {
  const mapping: Record<number, WeatherCondition> = {
    0: 'sunny',
    1: 'rainy',
    2: 'snowy',
    3: 'cloudy',
  };

  return mapping[index] || 'sunny';
}

/**
 * Get weather condition emoji
 *
 * @param condition - Weather condition name
 * @returns string - Emoji representation
 */
export function getWeatherEmoji(condition: WeatherCondition): string {
  return CONDITION_METADATA[condition].emoji;
}

/**
 * Get weather condition display name
 *
 * @param condition - Weather condition name
 * @returns string - Display name
 */
export function getWeatherDisplayName(condition: WeatherCondition): string {
  return CONDITION_METADATA[condition].label;
}

/**
 * All available weather conditions
 */
export const ALL_WEATHER_CONDITIONS: WeatherCondition[] = WEATHER_CONDITION_ORDER;
