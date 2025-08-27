import { useState, useEffect } from 'react';
import { Clock, User } from 'lucide-react';
import FitnessModule from '@/components/dashboard/FitnessModule';
import FinanceModule from '@/components/dashboard/FinanceModule';
import EnvironmentModule from '@/components/dashboard/EnvironmentModule';
import MotivationModule from '@/components/dashboard/MotivationModule';

const Index = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const userName = "Aditya"; // This could be dynamic in the future

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Let's make today count! 💪",
      "Every step forward is progress. 🚀",
      "Your future self will thank you. ✨",
      "Consistency builds empires. 🏆",
      "Small wins, big results. 🎯"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
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
              <p className="text-muted-foreground">{getMotivationalMessage()}</p>
            </div>
            <div className="flex items-center gap-2 text-lg font-mono">
              <Clock className="h-5 w-5 text-primary" />
              <time>
                {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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