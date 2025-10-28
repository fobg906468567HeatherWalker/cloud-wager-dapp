import { useMemo, useState } from "react";
import { MapPin, Search, Thermometer, Droplets, Wind } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CITY_CATALOG } from "@/data/cities";

type CityWeatherSnapshot = {
  temp: number;
  humidity: number;
  wind: number;
};

interface CitySelectorProps {
  selectedCityId?: number;
  onCityChange: (cityId: number) => void;
  weatherSnapshots?: Record<number, CityWeatherSnapshot>;
  loading?: boolean;
}

export const CitySelector = ({ selectedCityId, onCityChange, weatherSnapshots, loading }: CitySelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCities = useMemo(
    () =>
      CITY_CATALOG.filter(
        (city) =>
          city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          city.country.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search for a city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
        {filteredCities.map((city) => {
          const snapshot = weatherSnapshots?.[city.id];
          return (
            <Button
              key={city.id}
              variant={selectedCityId === city.id ? "default" : "outline"}
              className="h-auto py-3 px-4 flex flex-col items-start transition-smooth"
              onClick={() => onCityChange(city.id)}
              disabled={loading}
            >
              <div className="flex items-center gap-2 w-full">
                <MapPin className="w-4 h-4" />
                <span className="font-semibold">{city.name}</span>
              </div>
              <span className="text-xs opacity-70">{city.country}</span>
              {snapshot && (
                <div className="mt-3 space-y-1 text-xs text-left">
                  <p className="flex items-center gap-2">
                    <Thermometer className="w-3 h-3" />
                    {snapshot.temp.toFixed(1)} °C
                  </p>
                  <p className="flex items-center gap-2">
                    <Droplets className="w-3 h-3" />
                    {snapshot.humidity}% humidity
                  </p>
                  <p className="flex items-center gap-2">
                    <Wind className="w-3 h-3" />
                    {snapshot.wind.toFixed(1)} m/s wind
                  </p>
                </div>
              )}
            </Button>
          );
        })}
      </div>

      {filteredCities.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No cities found matching "{searchQuery}"</p>
      )}
    </div>
  );
};
