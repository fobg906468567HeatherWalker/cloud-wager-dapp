/**
 * Weather Data Hook
 *
 * Mock hook for fetching weather data
 * In production, this would fetch from a real weather API
 */

import { useQuery } from '@tanstack/react-query';

interface WeatherData {
  temp: number;
  humidity: number;
  wind: number;
  condition: string;
}

/**
 * Fetch city weather (mock implementation)
 * In production, integrate with OpenWeather API or similar
 */
export function useCityWeather(cityId?: number) {
  return useQuery({
    queryKey: ['weather', cityId],
    queryFn: async (): Promise<WeatherData> => {
      // Mock weather data
      // TODO: Replace with actual API call
      return {
        temp: 20 + Math.random() * 10,
        humidity: 50 + Math.random() * 30,
        wind: 5 + Math.random() * 5,
        condition: 'sunny',
      };
    },
    enabled: Boolean(cityId),
    staleTime: 60_000, // 1 minute
  });
}
