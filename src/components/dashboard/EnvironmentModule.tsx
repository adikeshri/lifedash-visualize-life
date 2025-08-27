import { Cloud, Thermometer, Wind, Droplets, Sun, Sunset } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';

const EnvironmentModule = () => {
  // Mock data
  const temperatureData = [
    { time: '00:00', temp: 18 },
    { time: '06:00', temp: 16 },
    { time: '12:00', temp: 24 },
    { time: '18:00', temp: 22 },
    { time: '24:00', temp: 19 },
  ];

  const aqiData = [
    { time: '00:00', aqi: 45 },
    { time: '06:00', aqi: 38 },
    { time: '12:00', aqi: 52 },
    { time: '18:00', aqi: 48 },
    { time: '24:00', aqi: 42 },
  ];

  const currentWeather = {
    temp: 22,
    high: 24,
    low: 16,
    humidity: 65,
    aqi: 42,
    condition: "Partly Cloudy",
    rainChance: 20,
    sunrise: "06:32",
    sunset: "19:45"
  };

  const getAQILevel = (aqi: number) => {
    if (aqi <= 50) return { level: "Good", color: "text-fitness" };
    if (aqi <= 100) return { level: "Moderate", color: "text-motivation" };
    if (aqi <= 150) return { level: "Unhealthy for Sensitive", color: "text-destructive" };
    return { level: "Unhealthy", color: "text-destructive" };
  };

  const aqiInfo = getAQILevel(currentWeather.aqi);

  return (
    <div className="dashboard-card p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-environment/10">
          <Cloud className="h-6 w-6 text-environment" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Environment</h2>
          <p className="text-sm text-muted-foreground">Weather & air quality</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Current Temperature */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-environment" />
              <span className="metric-label">Temperature</span>
            </div>
            <div className="text-right">
              <div className="metric-value text-environment">{currentWeather.temp}°C</div>
              <div className="text-xs text-muted-foreground">
                H:{currentWeather.high}° L:{currentWeather.low}°
              </div>
            </div>
          </div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={temperatureData}>
                <Area 
                  type="monotone" 
                  dataKey="temp" 
                  stroke="hsl(var(--environment))" 
                  fill="hsl(var(--environment))"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [`${value}°C`, 'Temperature']}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Air Quality */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-environment" />
              <span className="metric-label">Air Quality</span>
            </div>
            <div className="text-right">
              <div className="metric-value text-environment">{currentWeather.aqi}</div>
              <div className={`text-xs ${aqiInfo.color}`}>{aqiInfo.level}</div>
            </div>
          </div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={aqiData}>
                <Line 
                  type="monotone" 
                  dataKey="aqi" 
                  stroke="hsl(var(--environment))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--environment))', strokeWidth: 0, r: 2 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [value, 'AQI']}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-3 w-3 text-environment" />
                <span className="text-xs text-muted-foreground">Humidity</span>
              </div>
              <span className="text-sm font-medium">{currentWeather.humidity}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="h-3 w-3 text-environment" />
                <span className="text-xs text-muted-foreground">Sunrise</span>
              </div>
              <span className="text-sm font-medium">{currentWeather.sunrise}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="h-3 w-3 text-environment" />
                <span className="text-xs text-muted-foreground">Rain</span>
              </div>
              <span className="text-sm font-medium">{currentWeather.rainChance}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sunset className="h-3 w-3 text-environment" />
                <span className="text-xs text-muted-foreground">Sunset</span>
              </div>
              <span className="text-sm font-medium">{currentWeather.sunset}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentModule;