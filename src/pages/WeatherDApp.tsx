/**
 * Weather DApp Main Page
 *
 * Complete DApp for placing encrypted weather forecasts with FHE
 * Integrates wallet connection, encryption, and smart contract interaction
 */

import { useCallback } from "react";
import { Cloud, MapPin, Coins, Sun, TrendingUp, Clock } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CitySelector } from "@/components/weather/CitySelector";
import { WeatherTypeSelector } from "@/components/weather/WeatherTypeSelector";
import { useForecastStore } from "@/store/forecastStore";
import { useCityMarket, usePlaceForecast } from "@/hooks/useForecastContract";
import { useAccount } from "wagmi";
import { MIN_STAKE_ETH, MAX_STAKE_ETH } from "@/lib/config";
import { getCityName } from "@/data/cities";
import { getWeatherDisplayName } from "@/lib/weather";

const WeatherDApp = () => {
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const {
    cityId,
    stakeEth,
    condition,
    setCity,
    setStake,
    setCondition,
    setSubmitting,
    isSubmitting,
    reset,
  } = useForecastStore();

  const { data: market, isLoading: marketLoading } = useCityMarket(cityId || undefined);
  const placeForecast = usePlaceForecast(cityId || undefined);

  /**
   * Handle forecast submission with FHE encryption
   */
  const handleSubmit = useCallback(async () => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to place a forecast.",
        variant: "destructive",
      });
      return;
    }

    if (!cityId || !condition || !stakeEth) {
      toast({
        title: "Missing Information",
        description: "Please select a city, weather condition, and stake amount.",
        variant: "destructive",
      });
      return;
    }

    const stake = parseFloat(stakeEth);
    if (isNaN(stake) || stake < parseFloat(MIN_STAKE_ETH) || stake > parseFloat(MAX_STAKE_ETH)) {
      toast({
        title: "Invalid Stake Amount",
        description: `Stake must be between ${MIN_STAKE_ETH} and ${MAX_STAKE_ETH} ETH.`,
        variant: "destructive",
      });
      return;
    }

    if (market && !market.exists) {
      toast({
        title: "Market Not Available",
        description: "No market exists for this city yet.",
        variant: "destructive",
      });
      return;
    }

    if (market && market.lockTimestamp < Date.now() / 1000) {
      toast({
        title: "Market Closed",
        description: "This market is already closed for betting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      await placeForecast.mutateAsync({ cityId, condition, stakeEth });

      toast({
        title: "Forecast Submitted! 🎉",
        description: `Encrypted bet for ${stakeEth} ETH on ${getWeatherDisplayName(condition)} in ${getCityName(cityId)}.`,
      });

      reset();
    } catch (error) {
      console.error('Forecast submission error:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit forecast. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [isConnected, address, cityId, condition, stakeEth, market, placeForecast, toast, setSubmitting, reset]);

  return (
    <div className="min-h-screen bg-sky-gradient">
      {/* Header with RainbowKit Wallet Connection */}
      <header className="border-b border-primary/20 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cloud className="w-8 h-8 text-primary weather-pulse" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">WeatherWager</h1>
              <p className="text-xs text-muted-foreground hidden md:block">Encrypted Predictions</p>
            </div>
          </div>

          {/* RainbowKit Connect Button - Coinbase Disabled in wagmi config */}
          <ConnectButton
            showBalance={true}
            chainStatus="icon"
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Title Section */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Predict Tomorrow's Weather
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose a city, forecast the weather, and place your encrypted bet using FHE technology
            </p>
          </div>

          {/* Forecast Form Card */}
          <Card className="p-6 md:p-8 bg-card/95 backdrop-blur-sm shadow-xl border-primary/20">
            <div className="space-y-6 md:space-y-8">
              {/* City Selection */}
              <div>
                <Label className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Select City
                </Label>
                <CitySelector
                  selectedCityId={cityId || undefined}
                  onCityChange={setCity}
                  loading={marketLoading}
                />
              </div>

              {/* Weather Type Selection */}
              <div>
                <Label className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Sun className="w-5 h-5" />
                  Forecast Weather Type
                </Label>
                <WeatherTypeSelector
                  selectedWeather={condition || undefined}
                  onWeatherChange={setCondition}
                />
              </div>

              {/* Bet Amount */}
              <div>
                <Label htmlFor="betAmount" className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Coins className="w-5 h-5" />
                  Bet Amount (ETH)
                </Label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="betAmount"
                    type="number"
                    placeholder={`${MIN_STAKE_ETH} - ${MAX_STAKE_ETH}`}
                    step="0.001"
                    min={MIN_STAKE_ETH}
                    max={MAX_STAKE_ETH}
                    value={stakeEth}
                    onChange={(e) => setStake(e.target.value)}
                    className="pl-12 h-14 text-lg"
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Min: {MIN_STAKE_ETH} ETH • Max: {MAX_STAKE_ETH} ETH
                </p>
              </div>

              {/* Market Info */}
              {market && market.exists && (
                <Card className="p-4 bg-muted/50 border-primary/10">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Market locks:</span>
                    </div>
                    <span className="font-semibold">
                      {new Date(market.lockTimestamp * 1000).toLocaleString()}
                    </span>
                  </div>
                </Card>
              )}

              {/* Submit Button */}
              <Button
                size="lg"
                className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={handleSubmit}
                disabled={isSubmitting || !isConnected || !cityId || !condition || !stakeEth}
              >
                {isSubmitting ? (
                  <>
                    <Cloud className="w-5 h-5 mr-2 animate-spin" />
                    Encrypting & Submitting...
                  </>
                ) : !isConnected ? (
                  <>
                    <MapPin className="w-5 h-5 mr-2" />
                    Connect Wallet to Continue
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
                🔐 Your forecast will be encrypted using <strong>FHE</strong> before submission to ensure complete privacy
              </p>
            </div>
          </Card>

          {/* How It Works */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: MapPin, title: "Select City", desc: "Choose from available cities" },
              { icon: Sun, title: "Predict Weather", desc: "Pick tomorrow's conditions" },
              { icon: Cloud, title: "Encrypted Bet", desc: "Your data is encrypted with FHE" },
              { icon: TrendingUp, title: "Win Rewards", desc: "Get paid for accurate predictions" },
            ].map((step, idx) => (
              <Card
                key={idx}
                className="p-4 md:p-6 text-center bg-card/80 backdrop-blur-sm border-primary/20 transition-smooth hover:scale-105"
              >
                <step.icon className="w-8 md:w-10 h-8 md:h-10 mx-auto mb-3 text-primary weather-pulse" />
                <h3 className="font-semibold mb-2 text-sm md:text-base">{step.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default WeatherDApp;
