import { useState } from "react";
import { MapPin, Thermometer, Droplets, Wind } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// Mock city weather data
const CITIES_DATA = [
  {
    name: "New York",
    country: "USA",
    temp: 18,
    humidity: 65,
    wind: 12,
    condition: "Partly Cloudy",
  },
  {
    name: "London",
    country: "UK",
    temp: 14,
    humidity: 78,
    wind: 15,
    condition: "Rainy",
  },
  {
    name: "Tokyo",
    country: "Japan",
    temp: 22,
    humidity: 60,
    wind: 8,
    condition: "Sunny",
  },
  {
    name: "Paris",
    country: "France",
    temp: 16,
    humidity: 70,
    wind: 10,
    condition: "Cloudy",
  },
  {
    name: "Sydney",
    country: "Australia",
    temp: 25,
    humidity: 55,
    wind: 18,
    condition: "Sunny",
  },
  {
    name: "Singapore",
    country: "Singapore",
    temp: 28,
    humidity: 85,
    wind: 6,
    condition: "Humid",
  },
];

export const CityShowcase = () => {
  const navigate = useNavigate();
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            Featured Cities
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose from popular cities around the world
          </p>
        </div>

        {/* City Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {CITIES_DATA.map((city) => (
            <Card
              key={city.name}
              className="p-6 cursor-pointer transition-smooth hover:scale-105 hover:shadow-xl border-primary/20 bg-card/95 backdrop-blur-sm"
              onMouseEnter={() => setHoveredCity(city.name)}
              onMouseLeave={() => setHoveredCity(null)}
              onClick={() => navigate(`/app?city=${city.name}`)}
            >
              {/* City Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    {city.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{city.country}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">{city.temp}°</p>
                  <p className="text-xs text-muted-foreground">{city.condition}</p>
                </div>
              </div>

              {/* Weather Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Thermometer className="w-4 h-4" />
                    Temperature
                  </span>
                  <span className="font-semibold">{city.temp}°C</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Droplets className="w-4 h-4" />
                    Humidity
                  </span>
                  <span className="font-semibold">{city.humidity}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Wind className="w-4 h-4" />
                    Wind Speed
                  </span>
                  <span className="font-semibold">{city.wind} km/h</span>
                </div>
              </div>

              {/* Hover Action */}
              {hoveredCity === city.name && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full animate-fade-in"
                >
                  Predict {city.name}'s Weather
                </Button>
              )}
            </Card>
          ))}
        </div>

        {/* View All Cities Button */}
        <div className="text-center">
          <Button
            size="lg"
            variant="outline"
            className="border-2"
            onClick={() => navigate("/app")}
          >
            View All Cities
          </Button>
        </div>
      </div>
    </section>
  );
};
