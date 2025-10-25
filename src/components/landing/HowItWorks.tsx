import { Wallet, MapPin, Lock, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";

const STEPS = [
  {
    icon: Wallet,
    title: "Connect Wallet",
    description: "Link your crypto wallet to get started with WeatherWager",
    step: 1,
  },
  {
    icon: MapPin,
    title: "Choose City",
    description: "Select from cities worldwide to make your weather prediction",
    step: 2,
  },
  {
    icon: Lock,
    title: "Encrypt & Bet",
    description: "Your forecast is encrypted with FHE before being submitted on-chain",
    step: 3,
  },
  {
    icon: Trophy,
    title: "Win Rewards",
    description: "Official weather data verifies predictions and distributes rewards",
    step: 4,
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-20 px-4 bg-sky-gradient">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to start forecasting weather and earning rewards with complete privacy
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((step, idx) => (
            <div key={idx} className="relative">
              {/* Connector Line (hidden on mobile, shown on larger screens) */}
              {idx < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-1/2 w-full h-0.5 bg-primary/30 -z-10" />
              )}

              {/* Step Card */}
              <Card className="p-6 text-center bg-card/95 backdrop-blur-sm border-primary/20 relative z-10 transition-smooth hover:scale-105">
                {/* Step Number Badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="mt-4 mb-4 flex justify-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-primary weather-pulse" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3 text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </Card>
            </div>
          ))}
        </div>

        {/* Privacy Notice */}
        <div className="mt-16 bg-card/80 backdrop-blur-sm border border-primary/20 rounded-lg p-6 max-w-3xl mx-auto">
          <div className="flex items-start gap-4">
            <Lock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-lg mb-2 text-foreground">
                Privacy-First Design
              </h4>
              <p className="text-muted-foreground">
                WeatherWager uses Fully Homomorphic Encryption (FHE) to ensure your predictions 
                remain completely private until the forecast period ends. No one—not even the 
                contract operators—can see your bet before settlement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
