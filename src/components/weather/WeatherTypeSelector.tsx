import { Sun, Cloud, CloudRain, CloudSnow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeatherType } from "@/pages/WeatherDApp";

interface WeatherTypeSelectorProps {
  selectedWeather: WeatherType | null;
  onWeatherChange: (weather: WeatherType) => void;
}

const WEATHER_TYPES = [
  {
    type: "sunny" as WeatherType,
    icon: Sun,
    label: "Sunny",
    color: "text-accent",
    bgColor: "hover:bg-accent/10",
  },
  {
    type: "cloudy" as WeatherType,
    icon: Cloud,
    label: "Cloudy",
    color: "text-muted-foreground",
    bgColor: "hover:bg-muted/50",
  },
  {
    type: "rainy" as WeatherType,
    icon: CloudRain,
    label: "Rainy",
    color: "text-primary",
    bgColor: "hover:bg-primary/10",
  },
  {
    type: "snowy" as WeatherType,
    icon: CloudSnow,
    label: "Snowy",
    color: "text-secondary",
    bgColor: "hover:bg-secondary/10",
  },
];

export const WeatherTypeSelector = ({
  selectedWeather,
  onWeatherChange,
}: WeatherTypeSelectorProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {WEATHER_TYPES.map(({ type, icon: Icon, label, color, bgColor }) => (
        <Button
          key={type}
          variant={selectedWeather === type ? "default" : "outline"}
          className={`h-32 flex flex-col items-center justify-center gap-3 transition-smooth ${
            selectedWeather !== type && bgColor
          }`}
          onClick={() => onWeatherChange(type)}
        >
          <Icon
            className={`w-12 h-12 ${
              selectedWeather === type ? "text-primary-foreground" : color
            } weather-pulse`}
          />
          <span className="text-lg font-semibold">{label}</span>
        </Button>
      ))}
    </div>
  );
};
