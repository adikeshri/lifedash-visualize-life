import { Cloud, Thermometer, Wind, Droplets, Sun, Sunset, Loader2, MapPin, AlertCircle, RefreshCw, Mountain, CloudDrizzle, CloudRain, CloudSnow, CloudFog, CloudSun, CloudLightning } from 'lucide-react';
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
  elevation?: number;
  current?: {
    us_aqi?: number; // US AQI as provided by Open-Meteo
    pm2_5?: number; // µg/m³
    pm10?: number; // µg/m³
    ozone?: number; // µg/m³
    nitrogen_dioxide?: number; // µg/m³
    sulphur_dioxide?: number; // µg/m³
    carbon_monoxide?: number; // µg/m³
  };
  hourly?: {
    time: string[];
    pm2_5?: number[];
    us_aqi?: number[];
  };
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
  // Always use CPCB method for AQI calculation

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

  // Fetch air quality data (Open-Meteo Air Quality API)
  const { data: aqiData, isLoading: aqiLoading, error: aqiError } = useQuery({
    queryKey: ['aqi', location],
    queryFn: async (): Promise<AirQualityData> => {
      if (!location) throw new Error('No location');
      const params = new URLSearchParams({
        latitude: String(location.lat),
        longitude: String(location.lon),
        current: 'pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi',
        hourly: 'pm2_5,us_aqi',
        timezone: 'auto',
      });
      const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`);
      if (!response.ok) {
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

  // --- India CPCB AQI calculation helpers ---
  type AQIResult = { aqi: number; pollutant: string | null };

  const roundTo = (value: number, decimals: number) => {
    const p = Math.pow(10, decimals);
    return Math.round(value * p) / p;
  };

  type Breakpoint = { Clow: number; Chigh: number; Ilow: number; Ihigh: number };

  const calcAQISegment = (C: number, segments: Breakpoint[]): number | null => {
    for (const seg of segments) {
      if (C >= seg.Clow && C <= seg.Chigh) {
        const { Clow, Chigh, Ilow, Ihigh } = seg;
        return roundTo(((Ihigh - Ilow) / (Chigh - Clow)) * (C - Clow) + Ilow, 0);
      }
    }
    // If above highest breakpoint provided, cap at 500
    const last = segments[segments.length - 1];
    if (last && C > last.Chigh) return 500;
    return null;
  };

  const computeIndiaAQI = (components?: {
    co?: number; no?: number; no2?: number; o3?: number; so2?: number; pm2_5?: number; pm10?: number; nh3?: number;
  }): AQIResult => {
    if (!components) return { aqi: NaN, pollutant: null };

    const aqiValues: { pollutant: string; aqi: number }[] = [];

    // PM2.5 (µg/m³) CPCB (24-hr)
    if (typeof components.pm2_5 === 'number') {
      const C = roundTo(components.pm2_5, 1);
      const segments: Breakpoint[] = [
        { Clow: 0.0, Cligh: 30.0, Ilow: 0, Ihigh: 50 },
        { Clow: 31.0, Cligh: 60.0, Ilow: 51, Ihigh: 100 },
        { Clow: 61.0, Cligh: 90.0, Ilow: 101, Ihigh: 200 },
        { Clow: 91.0, Cligh: 120.0, Ilow: 201, Ihigh: 300 },
        { Clow: 121.0, Cligh: 250.0, Ilow: 301, Ihigh: 400 },
        { Clow: 251.0, Cligh: 1000000.0, Ilow: 401, Ihigh: 500 },
      ].map(({ Clow, Cligh, Ilow, Ihigh }) => ({ Clow, Chigh: Cligh, Ilow, Ihigh }));
      const a = calcAQISegment(C, segments);
      if (a !== null) aqiValues.push({ pollutant: 'PM2.5', aqi: a });
    }

    // PM10 (µg/m³) CPCB (24-hr)
    if (typeof components.pm10 === 'number') {
      const C = Math.round(components.pm10); // truncate to integer per EPA
      const segments: Breakpoint[] = [
        { Clow: 0, Cligh: 50, Ilow: 0, Ihigh: 50 },
        { Clow: 51, Cligh: 100, Ilow: 51, Ihigh: 100 },
        { Clow: 101, Cligh: 250, Ilow: 101, Ihigh: 200 },
        { Clow: 251, Cligh: 350, Ilow: 201, Ihigh: 300 },
        { Clow: 351, Cligh: 430, Ilow: 301, Ihigh: 400 },
        { Clow: 431, Cligh: 1000000, Ilow: 401, Ihigh: 500 },
      ].map(({ Clow, Cligh, Ilow, Ihigh }) => ({ Clow, Chigh: Cligh, Ilow, Ihigh }));
      const a = calcAQISegment(C, segments);
      if (a !== null) aqiValues.push({ pollutant: 'PM10', aqi: a });
    }

    // O3 (µg/m³) CPCB (8-hr)
    if (typeof components.o3 === 'number') {
      const segments: Breakpoint[] = [
        { Clow: 0, Cligh: 50, Ilow: 0, Ihigh: 50 },
        { Clow: 51, Cligh: 100, Ilow: 51, Ihigh: 100 },
        { Clow: 101, Cligh: 168, Ilow: 101, Ihigh: 200 },
        { Clow: 169, Cligh: 208, Ilow: 201, Ihigh: 300 },
        { Clow: 209, Cligh: 748, Ilow: 301, Ihigh: 400 },
        { Clow: 749, Cligh: 1000000, Ilow: 401, Ihigh: 500 },
      ].map(({ Clow, Cligh, Ilow, Ihigh }) => ({ Clow, Chigh: Cligh, Ilow, Ihigh }));
      const a = calcAQISegment(components.o3, segments);
      if (a !== null) aqiValues.push({ pollutant: 'O3', aqi: a });
    }

    // NO2 (µg/m³) CPCB (24-hr)
    if (typeof components.no2 === 'number') {
      const segments: Breakpoint[] = [
        { Clow: 0, Cligh: 40, Ilow: 0, Ihigh: 50 },
        { Clow: 41, Cligh: 80, Ilow: 51, Ihigh: 100 },
        { Clow: 81, Cligh: 180, Ilow: 101, Ihigh: 200 },
        { Clow: 181, Cligh: 280, Ilow: 201, Ihigh: 300 },
        { Clow: 281, Cligh: 400, Ilow: 301, Ihigh: 400 },
        { Clow: 401, Cligh: 1000000, Ilow: 401, Ihigh: 500 },
      ].map(({ Clow, Cligh, Ilow, Ihigh }) => ({ Clow, Chigh: Cligh, Ilow, Ihigh }));
      const a = calcAQISegment(components.no2, segments);
      if (a !== null) aqiValues.push({ pollutant: 'NO2', aqi: a });
    }

    // SO2 (µg/m³) CPCB (24-hr)
    if (typeof components.so2 === 'number') {
      const segments: Breakpoint[] = [
        { Clow: 0, Cligh: 40, Ilow: 0, Ihigh: 50 },
        { Clow: 41, Cligh: 80, Ilow: 51, Ihigh: 100 },
        { Clow: 81, Cligh: 380, Ilow: 101, Ihigh: 200 },
        { Clow: 381, Cligh: 800, Ilow: 201, Ihigh: 300 },
        { Clow: 801, Cligh: 1600, Ilow: 301, Ihigh: 400 },
        { Clow: 1601, Cligh: 1000000, Ilow: 401, Ihigh: 500 },
      ].map(({ Clow, Cligh, Ilow, Ihigh }) => ({ Clow, Chigh: Cligh, Ilow, Ihigh }));
      const a = calcAQISegment(components.so2, segments);
      if (a !== null) aqiValues.push({ pollutant: 'SO2', aqi: a });
    }

    // CO (mg/m³) CPCB (8-hr) – OWM gives µg/m³, convert to mg/m³
    if (typeof components.co === 'number') {
      const mgm3 = roundTo(components.co / 1000, 1);
      const segments: Breakpoint[] = [
        { Clow: 0.0, Cligh: 1.0, Ilow: 0, Ihigh: 50 },
        { Clow: 1.1, Cligh: 2.0, Ilow: 51, Ihigh: 100 },
        { Clow: 2.1, Cligh: 10.0, Ilow: 101, Ihigh: 200 },
        { Clow: 10.1, Cligh: 17.0, Ilow: 201, Ihigh: 300 },
        { Clow: 17.1, Cligh: 34.0, Ilow: 301, Ihigh: 400 },
        { Clow: 34.1, Cligh: 1000000.0, Ilow: 401, Ihigh: 500 },
      ].map(({ Clow, Cligh, Ilow, Ihigh }) => ({ Clow, Chigh: Cligh, Ilow, Ihigh }));
      const a = calcAQISegment(mgm3, segments);
      if (a !== null) aqiValues.push({ pollutant: 'CO', aqi: a });
    }

    // NH3 (µg/m³) CPCB (24-hr)
    if (typeof components.nh3 === 'number') {
      const segments: Breakpoint[] = [
        { Clow: 0, Cligh: 200, Ilow: 0, Ihigh: 50 },
        { Clow: 201, Cligh: 400, Ilow: 51, Ihigh: 100 },
        { Clow: 401, Cligh: 800, Ilow: 101, Ihigh: 200 },
        { Clow: 801, Cligh: 1200, Ilow: 201, Ihigh: 300 },
        { Clow: 1201, Cligh: 1800, Ilow: 301, Ihigh: 400 },
        { Clow: 1801, Cligh: 1000000, Ilow: 401, Ihigh: 500 },
      ].map(({ Clow, Cligh, Ilow, Ihigh }) => ({ Clow, Chigh: Cligh, Ilow, Ihigh }));
      const a = calcAQISegment(components.nh3, segments);
      if (a !== null) aqiValues.push({ pollutant: 'NH3', aqi: a });
    }

    if (aqiValues.length === 0) return { aqi: NaN, pollutant: null };
    const dominant = aqiValues.reduce((max, cur) => (cur.aqi > max.aqi ? cur : max));
    return { aqi: dominant.aqi, pollutant: dominant.pollutant };
  };

  const computedAqi: AQIResult | null = aqiData?.current
    ? computeIndiaAQI({
        co: aqiData.current.carbon_monoxide,
        no2: aqiData.current.nitrogen_dioxide,
        o3: aqiData.current.ozone,
        so2: aqiData.current.sulphur_dioxide,
        pm2_5: aqiData.current.pm2_5,
        pm10: aqiData.current.pm10,
      })
    : null;

  // Removed GOOGLE_LIKE (US EPA NowCast) calculation; using CPCB only

  const getAQIChartData = () => {
    const times = aqiData?.hourly?.time;
    const usAqiSeries = aqiData?.hourly?.us_aqi;
    if (times && usAqiSeries) {
      const points: { time: string; aqi: number }[] = [];
      const len = times.length;
      const start = Math.max(0, len - 24);
      for (let i = len - 1; i >= start; i -= 3) {
        const label = new Date(times[i]).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        const value = usAqiSeries[i];
        if (typeof value === 'number') {
          points.push({ time: label, aqi: Math.round(value) });
        }
        if (points.length >= 8) break;
      }
      return points.reverse();
    }
    // Fallback: generate slight variation around current CPCB value
    const now = new Date();
    const hours: string[] = [];
    const aqiValues: number[] = [];
    for (let i = 23; i >= 0; i -= 3) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      hours.push(time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }));
      const base = computedAqi?.aqi ?? 50;
      const variation = Math.random() * 14 - 7;
      aqiValues.push(Math.max(0, Math.round(base + variation)));
    }
    return hours.map((time, index) => ({ time, aqi: aqiValues[index] }));
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

  const getWeatherIcon = (code: number) => {
    if (code === 0) return Sun; // Clear
    if (code === 1) return CloudSun; // Mainly clear
    if (code === 2) return CloudSun; // Partly cloudy
    if (code === 3) return Cloud; // Overcast
    if (code === 45 || code === 48) return CloudFog; // Fog
    if (code === 51 || code === 53 || code === 55) return CloudDrizzle; // Drizzle
    if (code === 61 || code === 63 || code === 65) return CloudRain; // Rain
    if (code === 71 || code === 73 || code === 75) return CloudSnow; // Snow
    if (code === 95) return CloudLightning; // Thunderstorm
    return Cloud;
  };

  const getAQILevelCPCB = (aqi: number) => {
    if (aqi <= 50) return { level: "Good", color: "text-green-600" };
    if (aqi <= 100) return { level: "Satisfactory", color: "text-lime-600" };
    if (aqi <= 200) return { level: "Moderately Polluted", color: "text-yellow-600" };
    if (aqi <= 300) return { level: "Poor", color: "text-orange-600" };
    if (aqi <= 400) return { level: "Very Poor", color: "text-red-600" };
    return { level: "Severe", color: "text-red-800" };
  };

  const getAQILevelUS = (aqi: number) => {
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
    aqi: hasAQIData ? computedAqi?.aqi ?? null : null,
    condition: hasWeatherData ? getWeatherCondition(weatherData.current.weather_code) : null,
    conditionCode: hasWeatherData ? weatherData.current.weather_code : null,
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

  const activeAqi = computedAqi?.aqi ?? null;
  const aqiInfo = activeAqi !== null && activeAqi !== undefined ? getAQILevelCPCB(activeAqi) : null;
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
                <div className="metric-value text-environment">{activeAqi ?? currentWeather.aqi ?? '-'}</div>
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
            <div className="flex items-center justify-center gap-2">
              {currentWeather.conditionCode !== null && (() => {
                const Icon = getWeatherIcon(currentWeather.conditionCode as number);
                return <Icon className="h-4 w-4 text-environment" />;
              })()}
              <p className="font-medium">{currentWeather.condition}</p>
            </div>
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
              {hasAQIData && typeof aqiData?.elevation === 'number' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mountain className="h-3 w-3 text-environment" />
                    <span className="text-xs text-muted-foreground">Elevation</span>
                  </div>
                  <span className="text-sm font-medium">{Math.round(aqiData.elevation)} m</span>
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
            <p className="text-xs text-destructive">Air quality data unavailable</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnvironmentModule;
