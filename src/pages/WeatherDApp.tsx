import { useState } from "react";
import { Cloud, CloudRain, CloudSnow, Sun, Cloudy, MapPin, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CitySelector } from "@/components/weather/CitySelector";
import { WeatherTypeSelector } from "@/components/weather/WeatherTypeSelector";

// Weather type definitions
export type WeatherType = "sunny" | "rainy" | "snowy" | "cloudy";

const WeatherDApp = () => {
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedWeather, setSelectedWeather] = useState<WeatherType | null>(null);
  const [betAmount, setBetAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Simulate FHE encryption and submission
  const handleSubmit = async () => {
    if (!selectedCity || !selectedWeather || !betAmount) {
      toast({
        title: "Missing Information",
        description: "Please select a city, weather type, and enter a bet amount.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate FHE initialization and encryption
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real implementation, this would:
      // 1. Initialize FHE instance
      // 2. Encrypt weather type (euint8) and bet amount
      // 3. Submit encrypted data to smart contract
      
      toast({
        title: "Forecast Submitted!",
        description: `Your encrypted prediction for ${selectedCity} has been submitted successfully.`,
      });

      // Reset form
      setSelectedCity("");
      setSelectedWeather(null);
      setBetAmount("");
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit your forecast. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-gradient">
      {/* Header */}
      <header className="border-b border-primary/20 bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">WeatherWager</h1>
          </div>
          <Button variant="outline" size="sm">
            <MapPin className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Predict Tomorrow's Weather
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose a city, forecast the weather, and place your encrypted bet
            </p>
          </div>

          {/* Forecast Form Card */}
          <Card className="p-8 bg-card/95 backdrop-blur-sm shadow-xl border-primary/20">
            <div className="space-y-8">
              {/* City Selection */}
              <div>
                <Label htmlFor="city" className="text-lg font-semibold mb-3 block">
                  Select City
                </Label>
                <CitySelector
                  selectedCity={selectedCity}
                  onCityChange={setSelectedCity}
                />
              </div>

              {/* Weather Type Selection */}
              <div>
                <Label className="text-lg font-semibold mb-3 block">
                  Forecast Weather Type
                </Label>
                <WeatherTypeSelector
                  selectedWeather={selectedWeather}
                  onWeatherChange={setSelectedWeather}
                />
              </div>

              {/* Bet Amount */}
              <div>
                <Label htmlFor="betAmount" className="text-lg font-semibold mb-3 block">
                  Bet Amount (ETH)
                </Label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="betAmount"
                    type="number"
                    placeholder="0.01"
                    step="0.01"
                    min="0"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="pl-12 h-14 text-lg"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                size="lg"
                className="w-full h-14 text-lg font-semibold"
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedCity || !selectedWeather || !betAmount}
              >
                {isSubmitting ? (
                  <>
                    <Cloud className="w-5 h-5 mr-2 animate-spin" />
                    Encrypting & Submitting...
                  </>
                ) : (
                  <>
                    <Cloud className="w-5 h-5 mr-2" />
                    Submit Encrypted Forecast
                  </>
                )}
              </Button>

              {/* Info Text */}
              <p className="text-sm text-muted-foreground text-center">
                Your forecast will be encrypted using FHE before submission to ensure complete privacy
              </p>
            </div>
          </Card>

          {/* How It Works */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: MapPin, title: "Select City", desc: "Choose from available cities" },
              { icon: Sun, title: "Predict Weather", desc: "Pick tomorrow's conditions" },
              { icon: Cloud, title: "Place Bet", desc: "Encrypted with FHE" },
              { icon: Coins, title: "Win Rewards", desc: "Get paid for accuracy" },
            ].map((step, idx) => (
              <Card key={idx} className="p-6 text-center bg-card/80 backdrop-blur-sm border-primary/20 transition-smooth hover:scale-105">
                <step.icon className="w-10 h-10 mx-auto mb-3 text-primary weather-pulse" />
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default WeatherDApp;
