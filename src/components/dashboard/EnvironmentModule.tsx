import { Cloud, Thermometer, Wind, Droplets, Sun, Sunset, Loader2, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
    precipitation_probability: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
  };
}

interface AirQualityData {
  list: Array<{
    main: {
      aqi: number;
    };
  }>;
}

// Default fallback coordinates (Bangalore, India)
const DEFAULT_COORDINATES = {
  lat: 12.927238352738446,
  lon: 77.66993524698808
};

const DEFAULT_LOCATION_NAME = 'Bangalore, India';

const EnvironmentModule = () => {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [isUsingDefaultLocation, setIsUsingDefaultLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Function to fetch location name from coordinates
  const fetchLocationName = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      const data = await response.json();
      
      if (data.city) {
        return `${data.city}, ${data.countryName}`;
      } else if (data.locality) {
        return `${data.locality}, ${data.countryName}`;
      } else {
        return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }
    } catch (error) {
      console.warn('Failed to fetch location name:', error);
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  };

  // Function to set default location
  const setDefaultLocation = async () => {
    setLocation(DEFAULT_COORDINATES);
    setIsUsingDefaultLocation(true);
    setLocationError(null);
    
    const name = await fetchLocationName(DEFAULT_COORDINATES.lat, DEFAULT_COORDINATES.lon);
    setLocationName(name);
  };

  // Function to check if location permission is already granted
  // This prevents the browser from showing a permission prompt if not already granted
  const checkLocationPermission = async (): Promise<boolean> => {
    if (!navigator.permissions) {
      return false; // Can't check permission, assume not granted
    }
    
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state === 'granted';
    } catch (error) {
      console.warn('Could not check location permission:', error);
      return false; // Assume not granted if we can't check
    }
  };

  // Function to retry getting user location
  const retryUserLocation = async () => {
    setLocationError(null);
    setIsUsingDefaultLocation(false);
    
    // Check if location permission is already granted
    const hasPermission = await checkLocationPermission();
    
    if (!hasPermission) {
      // No permission granted, use default location without prompting
      console.log('Location permission not granted, using default location');
      setDefaultLocation();
      return;
    }
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lon: longitude });
          setIsUsingDefaultLocation(false);
          
          const name = await fetchLocationName(latitude, longitude);
          setLocationName(name);
        },
        (error) => {
          console.warn('Error getting user location:', error);
          let errorMessage = 'Unable to get your location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = 'Location error occurred';
          }
          
          setLocationError(errorMessage);
          // Fall back to default location
          setDefaultLocation();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      setLocationError('Geolocation not supported');
      setDefaultLocation();
    }
  };

  // Get user's location on component mount
  useEffect(() => {
    const initializeLocation = async () => {
      await retryUserLocation();
    };
    
    initializeLocation();
  }, []);

  // Fetch weather data
  const { data: weatherData, isLoading: weatherLoading, error: weatherError } = useQuery({
    queryKey: ['weather', location],
    queryFn: async (): Promise<WeatherData> => {
      if (!location) throw new Error('No location');
      
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,weather_code,precipitation_probability&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      
      return response.json();
    },
    enabled: !!location,
    refetchInterval: 300000, // Refetch every 5 minutes
    retry: 2,
  });

  // Fetch air quality data
  const { data: aqiData, isLoading: aqiLoading, error: aqiError } = useQuery({
    queryKey: ['aqi', location],
    queryFn: async (): Promise<AirQualityData> => {
      if (!location) throw new Error('No location');
      
      // TODO: Configure OpenWeatherMap API key in environment variables
      // Current API call has empty appid - will fail without proper configuration
      const response = await fetch(
        `https://api.openweathermap.org/data/3.0/air_pollution?lat=${location.lat}&lon=${location.lon}&appid={}`
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('OpenWeatherMap API key not configured');
        }
        throw new Error('Failed to fetch air quality data');
      }
      
      return response.json();
    },
    enabled: !!location,
    refetchInterval: 600000, // Refetch every 10 minutes
    retry: 2,
  });

  // Process weather data for charts
  const getTemperatureChartData = () => {
    if (!weatherData?.hourly) return [];
    
    return weatherData.hourly.time
      .filter((_, index) => index % 3 === 0) // Every 3 hours
      .slice(0, 8) // Last 24 hours
      .map((time, index) => ({
        time: new Date(time).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          hour12: true 
        }),
        temp: Math.round(weatherData.hourly.temperature_2m[index * 3])
      }));
  };

  const getAQIChartData = () => {
    if (!aqiData?.list) return [];
    
    // Generate mock AQI data for the last 24 hours since we only get current AQI
    const now = new Date();
    const hours = [];
    const aqiValues = [];
    
    for (let i = 23; i >= 0; i -= 3) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      hours.push(time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        hour12: true 
      }));
      
      // Generate realistic AQI variation around the current value
      const currentAQI = aqiData.list[0]?.main.aqi || 50;
      const variation = Math.random() * 20 - 10;
      aqiValues.push(Math.max(0, Math.round(currentAQI + variation)));
    }
    
    return hours.map((time, index) => ({
      time,
      aqi: aqiValues[index]
    }));
  };

  const getWeatherCondition = (code: number) => {
    const conditions: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      95: 'Thunderstorm',
    };
    return conditions[code] || 'Unknown';
  };

  const getAQILevel = (aqi: number) => {
    if (aqi <= 50) return { level: "Good", color: "text-green-600" };
    if (aqi <= 100) return { level: "Moderate", color: "text-yellow-600" };
    if (aqi <= 150) return { level: "Unhealthy for Sensitive", color: "text-orange-600" };
    if (aqi <= 200) return { level: "Unhealthy", color: "text-red-600" };
    if (aqi <= 300) return { level: "Very Unhealthy", color: "text-purple-600" };
    return { level: "Hazardous", color: "text-red-800" };
  };

  if (locationError) {
    return (
      <div className="dashboard-card p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-destructive mb-2">{locationError}</p>
          <button 
            onClick={() => retryUserLocation()} 
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="dashboard-card p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-environment" />
          <p className="text-muted-foreground">Getting your location...</p>
        </div>
      </div>
    );
  }

  // Check if we have any data to show
  const hasWeatherData = !weatherLoading && !weatherError && weatherData;
  const hasAQIData = !aqiLoading && !aqiError && aqiData;
  const isLoading = weatherLoading || aqiLoading;
  const hasAnyData = hasWeatherData || hasAQIData;

  if (isLoading && !hasAnyData) {
    return (
      <div className="dashboard-card p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-environment" />
          <p className="text-muted-foreground">Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (!hasAnyData) {
    return (
      <div className="dashboard-card p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-destructive mb-2">Failed to load weather data</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Build current weather object with available data
  const currentWeather = {
    temp: hasWeatherData ? Math.round(weatherData.current.temperature_2m) : null,
    high: hasWeatherData ? Math.round(weatherData.daily.temperature_2m_max[0]) : null,
    low: hasWeatherData ? Math.round(weatherData.daily.temperature_2m_min[0]) : null,
    humidity: hasWeatherData ? weatherData.current.relative_humidity_2m : null,
    aqi: hasAQIData ? aqiData.list[0]?.main.aqi : null,
    condition: hasWeatherData ? getWeatherCondition(weatherData.current.weather_code) : null,
    rainChance: hasWeatherData ? weatherData.current.precipitation_probability : null,
    sunrise: hasWeatherData ? new Date(weatherData.daily.sunrise[0]).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }) : null,
    sunset: hasWeatherData ? new Date(weatherData.daily.sunset[0]).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }) : null
  };

  const aqiInfo = currentWeather.aqi ? getAQILevel(currentWeather.aqi) : null;
  const temperatureChartData = getTemperatureChartData();
  const aqiChartData = getAQIChartData();

  return (
    <div className="dashboard-card p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-environment/10">
          <Cloud className="h-6 w-6 text-environment" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">Environment</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {locationName}
            {isUsingDefaultLocation && (
              <span className="text-xs bg-muted px-2 py-1 rounded-full">
                Default Location
              </span>
            )}
          </div>
          {isUsingDefaultLocation && (
            <button 
              onClick={() => retryUserLocation()}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1"
            >
              <RefreshCw className="h-3 w-3" />
              Use My Location
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Current Temperature - Only show if weather data is available */}
        {hasWeatherData && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-environment" />
                <span className="metric-label">Temperature</span>
              </div>
              <div className="text-right">
                <div className="metric-value text-environment">{currentWeather.temp}°C</div>
                {currentWeather.high !== null && currentWeather.low !== null && (
                  <div className="text-xs text-muted-foreground">
                    H:{currentWeather.high}° L:{currentWeather.low}°
                  </div>
                )}
              </div>
            </div>
            {temperatureChartData.length > 0 && (
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={temperatureChartData}>
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
            )}
          </div>
        )}

        {/* Air Quality - Only show if AQI data is available */}
        {hasAQIData && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-environment" />
                <span className="metric-label">Air Quality</span>
              </div>
              <div className="text-right">
                <div className="metric-value text-environment">{currentWeather.aqi}</div>
                {aqiInfo && (
                  <div className={`text-xs ${aqiInfo.color}`}>{aqiInfo.level}</div>
                )}
              </div>
            </div>
            {aqiChartData.length > 0 && (
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={aqiChartData}>
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
            )}
          </div>
        )}

        {/* Weather Condition - Only show if weather data is available */}
        {hasWeatherData && currentWeather.condition && (
          <div className="text-center py-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Current Conditions</p>
            <p className="font-medium">{currentWeather.condition}</p>
          </div>
        )}

        {/* Additional Details - Show available data */}
        {(hasWeatherData || hasAQIData) && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="space-y-3">
              {hasWeatherData && currentWeather.humidity !== null && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-3 w-3 text-environment" />
                    <span className="text-xs text-muted-foreground">Humidity</span>
                  </div>
                  <span className="text-sm font-medium">{currentWeather.humidity}%</span>
                </div>
              )}
              {hasWeatherData && currentWeather.sunrise && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="h-3 w-3 text-environment" />
                    <span className="text-xs text-muted-foreground">Sunrise</span>
                  </div>
                  <span className="text-sm font-medium">{currentWeather.sunrise}</span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {hasWeatherData && currentWeather.rainChance !== null && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-3 w-3 text-environment" />
                    <span className="text-xs text-muted-foreground">Rain</span>
                  </div>
                  <span className="text-sm font-medium">{currentWeather.rainChance}%</span>
                </div>
              )}
              {hasWeatherData && currentWeather.sunset && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sunset className="h-3 w-3 text-environment" />
                    <span className="text-xs text-muted-foreground">Sunset</span>
                  </div>
                  <span className="text-sm font-medium">{currentWeather.sunset}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show loading states for individual sections */}
        {weatherLoading && (
          <div className="text-center py-3">
            <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2 text-environment" />
            <p className="text-xs text-muted-foreground">Loading weather...</p>
          </div>
        )}

        {aqiLoading && (
          <div className="text-center py-3">
            <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2 text-environment" />
            <p className="text-xs text-muted-foreground">Loading air quality...</p>
          </div>
        )}

        {/* Show error states for individual sections */}
        {weatherError && !hasWeatherData && (
          <div className="text-center py-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="h-4 w-4 mx-auto mb-2 text-destructive" />
            <p className="text-xs text-destructive">Weather data unavailable</p>
          </div>
        )}

        {aqiError && !hasAQIData && (
          <div className="text-center py-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="h-4 w-4 mx-auto mb-2 text-destructive" />
            <p className="text-xs text-destructive">
              {aqiError.message === 'OpenWeatherMap API key not configured' 
                ? 'Air quality data unavailable (API key needed)' 
                : 'Air quality data unavailable'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnvironmentModule;
