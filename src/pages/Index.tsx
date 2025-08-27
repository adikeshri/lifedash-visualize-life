import { useState, useEffect } from 'react';
import { Clock, User } from 'lucide-react';
import FitnessModule from '@/components/dashboard/FitnessModule';
import FinanceModule from '@/components/dashboard/FinanceModule';
import EnvironmentModule from '@/components/dashboard/EnvironmentModule';
import MotivationModule from '@/components/dashboard/MotivationModule';

const Index = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [motivationalQuote, setMotivationalQuote] = useState<string | null>(null);
  const userName = "Aditya"; // This could be dynamic in the future

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isActive = true;
    const fetchQuote = async () => {
      try {
        const response = await fetch('https://quotes-api-self.vercel.app/quote');
        if (!response.ok) return;
        const data: { quote?: string; author?: string } = await response.json();
        if (isActive && data?.quote) {
          setMotivationalQuote(data.author ? `${data.quote} — ${data.author}` : data.quote);
        }
      } catch {
        // ignore errors
      }
    };
    fetchQuote();
    const interval = setInterval(fetchQuote, 30 * 60 * 1000);
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatDate = (date) => {
    const day = date.getDate();
    const month = date.toLocaleString("en-GB", { month: "short" }); // Aug
    const year = date.getFullYear();

    const getOrdinal = (n) => {
      if (n > 3 && n < 21) return "th";
      switch (n % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
      }
    };

    return `${month} ${day}${getOrdinal(day)}, ${year}`;
  };

  const formatTime = (date) => {
    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const formatDay = (date) => {
    return date.toLocaleString("en-US", { weekday: "long" });
  };

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="dashboard-card p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold">
                  {getGreeting()}, {userName}
                </h1>
              </div>
              <p className="text-muted-foreground">{motivationalQuote ?? ""}</p>
            </div>
            <div className="flex items-center gap-2 text-lg font-mono">
              <Clock className="h-5 w-5 text-primary" />
              <time>
                {formatDay(currentTime)} - {formatDate(currentTime)}  • {formatTime(currentTime)}
              </time>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Fitness Module - Takes 2 columns on XL screens */}
          <div className="xl:col-span-2">
            <FitnessModule />
          </div>
          
          {/* Finance Module */}
          <div className="xl:col-span-1">
            <FinanceModule />
          </div>
          
          {/* Environment Module */}
          <div className="xl:col-span-1">
            <EnvironmentModule />
          </div>
        </div>

        {/* Bottom Row - Motivation takes full width */}
        <div className="grid grid-cols-1">
          <MotivationModule />
        </div>
      </div>
    </div>
  );
};

export default Index;