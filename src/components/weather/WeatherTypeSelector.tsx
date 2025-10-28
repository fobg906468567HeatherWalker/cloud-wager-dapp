import { Sun, Cloud, CloudRain, CloudSnow } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WeatherCondition } from "@/types/weather";
import { CONDITION_METADATA, WEATHER_CONDITION_ORDER } from "@/lib/weather";

interface WeatherTypeSelectorProps {
  selectedWeather?: WeatherCondition;
  onWeatherChange: (weather: WeatherCondition) => void;
}

const ICON_MAP: Record<WeatherCondition, typeof Sun> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
};

export const WeatherTypeSelector = ({ selectedWeather, onWeatherChange }: WeatherTypeSelectorProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {WEATHER_CONDITION_ORDER.map((condition) => {
        const Icon = ICON_MAP[condition];
        const meta = CONDITION_METADATA[condition];
        const isActive = selectedWeather === condition;
        return (
          <Button
            key={condition}
            variant={isActive ? "default" : "outline"}
            className={`h-32 flex flex-col items-center justify-center gap-3 transition-smooth ${
              isActive ? "" : "hover:bg-muted/40"
            }`}
            onClick={() => onWeatherChange(condition)}
          >
            <Icon className={`w-12 h-12 ${isActive ? "text-primary-foreground" : "text-primary"} weather-pulse`} />
            <span className="text-lg font-semibold">{meta.label}</span>
            <span className="text-xs text-muted-foreground">{meta.description}</span>
          </Button>
        );
      })}
    </div>
  );
};
