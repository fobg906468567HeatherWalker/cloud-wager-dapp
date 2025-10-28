import { useMemo } from "react";
import { useAccount } from "wagmi";
import { useCityTickets } from "@/hooks/useForecastContract";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const WeatherHistory = () => {
  const { address } = useAccount();
  const { data, isLoading } = useCityTickets(undefined);

  const myTickets = useMemo(() => data?.filter((ticket) => ticket.bettor === address) ?? [], [data, address]);

  return (
    <div className="min-h-screen bg-sky-gradient">
      <div className="container mx-auto px-4 py-12">
        <Card className="p-6 bg-card/90 backdrop-blur border-primary/20">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-semibold">Forecast History</h2>
            <Button variant="outline">Refresh</Button>
          </div>
          <div className="mt-6 space-y-4">
            {isLoading && <Skeleton className="h-20 w-full" />}
            {!isLoading && myTickets.length === 0 && <p>No history yet</p>}
            {!isLoading &&
              myTickets.map((ticket) => (
                <Card key={ticket.ticketId} className="p-4 bg-muted/50 border-none">
                  <p className="text-sm text-muted-foreground">City ID #{ticket.cityId}</p>
                  <p className="text-lg font-semibold">Ticket #{ticket.ticketId}</p>
                </Card>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WeatherHistory;
