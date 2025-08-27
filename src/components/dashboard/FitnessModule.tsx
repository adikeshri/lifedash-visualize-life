import { Activity, Heart, Moon, Footprints } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';

const FitnessModule = () => {
  // Mock data - In real implementation, this would come from APIs
  const weightData = [
    { date: 'Mon', weight: 75.2 },
    { date: 'Tue', weight: 75.0 },
    { date: 'Wed', weight: 74.8 },
    { date: 'Thu', weight: 74.9 },
    { date: 'Fri', weight: 74.6 },
    { date: 'Sat', weight: 74.4 },
    { date: 'Sun', weight: 74.3 },
  ];

  const calorieData = [
    { date: 'Mon', consumed: 2100, target: 2000 },
    { date: 'Tue', consumed: 1950, target: 2000 },
    { date: 'Wed', consumed: 2200, target: 2000 },
    { date: 'Thu', consumed: 1800, target: 2000 },
    { date: 'Fri', consumed: 2050, target: 2000 },
    { date: 'Sat', consumed: 2300, target: 2000 },
    { date: 'Sun', consumed: 1900, target: 2000 },
  ];

  const sleepData = [
    { date: 'Mon', hours: 7.5, quality: 85 },
    { date: 'Tue', hours: 6.8, quality: 72 },
    { date: 'Wed', hours: 8.2, quality: 91 },
    { date: 'Thu', hours: 7.1, quality: 78 },
    { date: 'Fri', hours: 6.5, quality: 68 },
    { date: 'Sat', hours: 8.8, quality: 95 },
    { date: 'Sun', hours: 8.0, quality: 88 },
  ];

  const stepsData = [
    { date: 'Mon', steps: 8500 },
    { date: 'Tue', steps: 12000 },
    { date: 'Wed', steps: 6800 },
    { date: 'Thu', steps: 9200 },
    { date: 'Fri', steps: 11500 },
    { date: 'Sat', steps: 15000 },
    { date: 'Sun', steps: 7800 },
  ];

  return (
    <div className="dashboard-card p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-fitness/10">
          <Activity className="h-6 w-6 text-fitness" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Fitness Overview</h2>
          <p className="text-sm text-muted-foreground">Track your health journey</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Weight Tracking */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-fitness" />
              <span className="metric-label">Weight</span>
            </div>
            <span className="metric-value text-fitness">74.3kg</span>
          </div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightData}>
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="hsl(var(--fitness))" 
                  fill="hsl(var(--fitness))"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Calories */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-fitness" />
              <span className="metric-label">Calories</span>
            </div>
            <span className="metric-value text-fitness">1,900</span>
          </div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={calorieData}>
                <Bar dataKey="consumed" fill="hsl(var(--fitness))" radius={[2, 2, 0, 0]} />
                <Bar dataKey="target" fill="hsl(var(--fitness-light))" opacity={0.3} radius={[2, 2, 0, 0]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sleep */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-fitness" />
              <span className="metric-label">Sleep</span>
            </div>
            <span className="metric-value text-fitness">8.0h</span>
          </div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sleepData}>
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="hsl(var(--fitness))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--fitness))', strokeWidth: 0, r: 3 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Footprints className="h-4 w-4 text-fitness" />
              <span className="metric-label">Steps</span>
            </div>
            <span className="metric-value text-fitness">7,800</span>
          </div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stepsData}>
                <Bar dataKey="steps" fill="hsl(var(--fitness))" radius={[2, 2, 0, 0]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FitnessModule;