/**
 * City Catalog Data
 *
 * Contains information about all supported cities for weather predictions
 */

export interface CityData {
  id: number;
  name: string;
  country: string;
  timezone: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

/**
 * Catalog of available cities for weather betting
 * Each city has a unique ID used in smart contract
 */
export const CITY_CATALOG: CityData[] = [
  {
    id: 1,
    name: "New York",
    country: "USA",
    timezone: "America/New_York",
    coordinates: { lat: 40.7128, lon: -74.0060 },
  },
  {
    id: 2,
    name: "London",
    country: "UK",
    timezone: "Europe/London",
    coordinates: { lat: 51.5074, lon: -0.1278 },
  },
  {
    id: 3,
    name: "Tokyo",
    country: "Japan",
    timezone: "Asia/Tokyo",
    coordinates: { lat: 35.6762, lon: 139.6503 },
  },
  {
    id: 4,
    name: "Paris",
    country: "France",
    timezone: "Europe/Paris",
    coordinates: { lat: 48.8566, lon: 2.3522 },
  },
  {
    id: 5,
    name: "Sydney",
    country: "Australia",
    timezone: "Australia/Sydney",
    coordinates: { lat: -33.8688, lon: 151.2093 },
  },
  {
    id: 6,
    name: "Dubai",
    country: "UAE",
    timezone: "Asia/Dubai",
    coordinates: { lat: 25.2048, lon: 55.2708 },
  },
  {
    id: 7,
    name: "Singapore",
    country: "Singapore",
    timezone: "Asia/Singapore",
    coordinates: { lat: 1.3521, lon: 103.8198 },
  },
  {
    id: 8,
    name: "Shanghai",
    country: "China",
    timezone: "Asia/Shanghai",
    coordinates: { lat: 31.2304, lon: 121.4737 },
  },
];

/**
 * Get city by ID
 */
export function getCityById(id: number): CityData | undefined {
  return CITY_CATALOG.find((city) => city.id === id);
}

/**
 * Get city name by ID
 */
export function getCityName(id: number): string {
  return getCityById(id)?.name || "Unknown City";
}