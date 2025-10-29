/**
 * Loading State Components
 *
 * Reusable loading indicators for different scenarios
 * Provides consistent loading UX across the application
 *
 * Features:
 * - Multiple loading indicator styles
 * - Skeleton loaders for content
 * - Responsive design
 * - Customizable sizes and messages
 */

import { Loader2, Cloud, CloudRain, CloudSnow, Sun } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Props for loading spinner component
 */
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
}

/**
 * Simple loading spinner with optional message
 *
 * @example
 * ```tsx
 * <LoadingSpinner message="Loading forecasts..." />
 * ```
 */
export function LoadingSpinner({ size = "md", message, className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}

/**
 * Weather-themed loading animation
 * Cycles through weather icons
 *
 * @example
 * ```tsx
 * <WeatherLoadingAnimation message="Fetching weather data..." />
 * ```
 */
export function WeatherLoadingAnimation({ message }: { message?: string }) {
  const weatherIcons = [Sun, Cloud, CloudRain, CloudSnow];
  const [currentIcon, setCurrentIcon] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIcon((prev) => (prev + 1) % weatherIcons.length);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const CurrentWeatherIcon = weatherIcons[currentIcon];

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className="relative">
        <CurrentWeatherIcon className="h-12 w-12 text-primary animate-pulse" />
      </div>
      {message && (
        <p className="text-sm text-muted-foreground font-medium">{message}</p>
      )}
    </div>
  );
}

/**
 * Full-page loading overlay
 * Blocks entire screen while loading
 *
 * @example
 * ```tsx
 * {isLoading && <FullPageLoader message="Loading application..." />}
 * ```
 */
export function FullPageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="p-8">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Skeleton loader for city market cards
 *
 * @example
 * ```tsx
 * {isLoading ? <CityMarketSkeleton /> : <CityMarket data={data} />}
 * ```
 */
export function CityMarketSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48 mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader for forecast ticket list
 *
 * @example
 * ```tsx
 * {isLoading ? <ForecastTicketSkeleton count={3} /> : <ForecastList />}
 * ```
 */
export function ForecastTicketSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-4 p-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Inline loading button state
 *
 * @example
 * ```tsx
 * <Button disabled={isLoading}>
 *   {isLoading ? <LoadingButton text="Submitting..." /> : "Submit"}
 * </Button>
 * ```
 */
export function LoadingButton({ text = "Loading..." }: { text?: string }) {
  return (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {text}
    </>
  );
}

/**
 * Progress indicator with percentage
 *
 * @example
 * ```tsx
 * <LoadingProgress value={65} message="Encrypting data..." />
 * ```
 */
export function LoadingProgress({ value, message }: { value: number; message?: string }) {
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{message}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// Import React hooks for animation
import { useEffect, useState } from "react";
