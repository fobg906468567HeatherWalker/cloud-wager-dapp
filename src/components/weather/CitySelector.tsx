import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CitySelectorProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
}

// Popular cities for weather forecasting
const POPULAR_CITIES = [
  { name: "New York", country: "USA", code: "NYC" },
  { name: "London", country: "UK", code: "LON" },
  { name: "Tokyo", country: "Japan", code: "TYO" },
  { name: "Paris", country: "France", code: "PAR" },
  { name: "Sydney", country: "Australia", code: "SYD" },
  { name: "Singapore", country: "Singapore", code: "SIN" },
  { name: "Dubai", country: "UAE", code: "DXB" },
  { name: "Hong Kong", country: "China", code: "HKG" },
];

export const CitySelector = ({ selectedCity, onCityChange }: CitySelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCities = POPULAR_CITIES.filter(
    (city) =>
      city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search for a city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12"
        />
      </div>

      {/* City Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
        {filteredCities.map((city) => (
          <Button
            key={city.code}
            variant={selectedCity === city.name ? "default" : "outline"}
            className="h-auto py-3 px-4 flex flex-col items-start transition-smooth"
            onClick={() => onCityChange(city.name)}
          >
            <div className="flex items-center gap-2 w-full">
              <MapPin className="w-4 h-4" />
              <span className="font-semibold">{city.name}</span>
            </div>
            <span className="text-xs opacity-70">{city.country}</span>
          </Button>
        ))}
      </div>

      {filteredCities.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No cities found matching "{searchQuery}"
        </p>
      )}
    </div>
  );
};
