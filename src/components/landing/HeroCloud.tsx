import { Cloud, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const HeroCloud = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-sky-gradient">
      {/* Floating clouds background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-32 bg-cloud-white/40 rounded-full blur-3xl cloud-float" />
        <div className="absolute top-40 right-20 w-80 h-40 bg-cloud-white/30 rounded-full blur-3xl cloud-float-delayed" />
        <div className="absolute bottom-32 left-1/3 w-96 h-48 bg-cloud-light/50 rounded-full blur-3xl cloud-float" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Logo/Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <Cloud className="w-24 h-24 text-primary weather-pulse" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full animate-ping" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-6xl md:text-7xl font-bold mb-6 text-foreground">
          WeatherWager
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl mb-4 text-foreground/80 max-w-3xl mx-auto">
          Predict tomorrow's weather with privacy-preserving technology
        </p>
        <p className="text-lg md:text-xl mb-12 text-muted-foreground max-w-2xl mx-auto">
          Place encrypted bets on weather forecasts using Fully Homomorphic Encryption. 
          Your predictions stay private until settlement.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            className="h-14 px-8 text-lg font-semibold shadow-lg transition-smooth hover:scale-105"
            onClick={() => navigate("/app")}
          >
            Start Forecasting
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-14 px-8 text-lg font-semibold border-2 transition-smooth hover:scale-105"
          >
            Learn How It Works
          </Button>
        </div>

        {/* Features highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            {
              title: "Fully Encrypted",
              desc: "Predictions encrypted with FHE before submission",
            },
            {
              title: "Fair Settlement",
              desc: "Verified with official weather data sources",
            },
            {
              title: "Win Rewards",
              desc: "Accurate forecasts earn cryptocurrency rewards",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-card/80 backdrop-blur-sm p-6 rounded-lg border border-primary/20 transition-smooth hover:scale-105"
            >
              <h3 className="font-semibold text-lg mb-2 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
