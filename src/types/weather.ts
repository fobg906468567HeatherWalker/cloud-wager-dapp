/**
 * Weather Type Definitions
 */

/**
 * Weather condition types supported by the system
 */
export type WeatherCondition = 'sunny' | 'rainy' | 'snowy' | 'cloudy';

/**
 * City information
 */
export interface City {
  id: number;
  name: string;
  country: string;
  timezone: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
}

/**
 * Weather forecast data structure
 */
export interface WeatherForecast {
  cityId: number;
  condition: WeatherCondition;
  temperature?: number;
  timestamp: number;
}

/**
 * Market data from contract
 */
export interface CityMarket {
  exists: boolean;
  conditionCount: number;
  lockTimestamp: number;
  settled: boolean;
  winningCondition: number;
  payoutRatio: bigint;
  totalDepositedWei: bigint;
  totalPaidWei: bigint;
}

/**
 * Forecast ticket from contract
 */
export interface ForecastTicket {
  ticketId: bigint;
  cityId: number;
  bettor: string;
  commitment: string;
  claimed: boolean;
}
