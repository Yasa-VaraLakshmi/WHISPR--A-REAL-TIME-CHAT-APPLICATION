import React, { useEffect, useState } from 'react';
import {
  Sun,
  CloudRain,
  CloudSnow,
  Droplets,
  Wind,
  Search,
} from 'lucide-react';

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler
);

const API_KEY = 'd2b13226ffac39da3e6da68722f5ee91';

const WeatherDashboard = () => {
  const [city, setCity] = useState('London');
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false);

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'Clear':
        return <Sun className="w-16 h-16 text-yellow-400" />;
      case 'Rain':
      case 'Drizzle':
        return <CloudRain className="w-16 h-16 text-blue-500" />;
      case 'Snow':
        return <CloudSnow className="w-16 h-16 text-blue-200" />;
      case 'Clouds':
        return <Sun className="w-16 h-16 text-gray-400" />;
      default:
        return <Droplets className="w-16 h-16 text-gray-500" />;
    }
  };

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      const geoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`
      );
      const geoData = await geoRes.json();
      if (!geoData.length) throw new Error('City not found');
      const { lat, lon } = geoData[0];

      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );
      const currentData = await currentRes.json();
      setCurrentWeather(currentData);

      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );
      const forecastJson = await forecastRes.json();
      const filteredForecast = forecastJson.list.filter((_, i) => i % 8 === 0);
      setForecastData(filteredForecast);

      const currentYear = new Date().getFullYear();
      const history = [];
      for (let i = 1; i <= 5; i++) {
        const mockHigh = 25 + Math.random() * 10; // 25°C to 35°C
        const mockLow = 5 + Math.random() * 10;   // 5°C to 15°C
        const mockRain = Math.random();           // 0 to 1
        history.push({
          year: currentYear - i,
          highTemp: parseFloat(mockHigh.toFixed(1)),
          lowTemp: parseFloat(mockLow.toFixed(1)),
          rainfallIndex: mockRain,
        });
      }
      setHistoricalData(history);
    } catch (err) {
      console.error('Error:', err);
      setCurrentWeather(null);
      setForecastData([]);
      setHistoricalData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const historicalChartData = {
    labels: historicalData.map((d) => d.year),
    datasets: [
      {
        label: 'High Temp (°C)',
        data: historicalData.map((d) => d.highTemp),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Low Temp (°C)',
        data: historicalData.map((d) => d.lowTemp),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const seasonalSummary = historicalData.map((d) => {
    const { year, highTemp, lowTemp, rainfallIndex } = d;
    const avgTemp = (highTemp + lowTemp) / 2;

    if (rainfallIndex > 0.7) return `${year}: Rainy Season`;
    if (avgTemp >= 25) return `${year}: Summer`;
    if (avgTemp >= 18 && avgTemp < 25) return `${year}: Spring`;
    if (avgTemp >= 10 && avgTemp < 18) return `${year}: Autumn`;
    return `${year}: Winter`;
  });

  const forecastChartData = {
    labels: forecastData.map((d) =>
      new Date(d.dt * 1000).toLocaleDateString()
    ),
    datasets: [
      {
        label: 'Temp (°C)',
        data: forecastData.map((d) => d.main.temp),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <div className="flex flex-col items-center px-4 pt-24">
      {/* Search Section */}
      <div className="w-full max-w-3xl mb-6 flex justify-center">
        <div className="flex w-full max-w-sm items-center">
          <input
            type="text"
            placeholder="Enter city"
            className="input input-bordered input-sm w-3/5"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchWeatherData()}
          />
          <button
            onClick={fetchWeatherData}
            className="btn btn-sm btn-outline ml-2"
          >
            <Search className="w-4 h-4" /> Search
          </button>
        </div>
      </div>

      {/* Current Weather */}
      <div className="bg-base-100 shadow-xl rounded-xl p-4 w-full max-w-xl mb-6">
        <div className="flex flex-col items-center mb-4">
          <h2 className="text-xl font-bold mb-2">Current Weather</h2>

          {loading ? (
            <div>Loading...</div>
          ) : currentWeather ? (
            <>
              <div className="flex flex-col items-center gap-2">
                {getWeatherIcon(currentWeather.weather[0].main)}
                <h3 className="text-2xl font-semibold">
                  {currentWeather.main.temp.toFixed(1)}°C
                </h3>
                <p className="capitalize text-sm">{currentWeather.weather[0].description}</p>
                <div className="text-xs text-gray-400">{currentWeather.name}</div>
                <div className="grid grid-cols-2 gap-2 mt-2 w-full text-xs">
                  <div className="flex items-center gap-1">
                    <Droplets className="w-4 h-4" />
                    {currentWeather.main.humidity}%
                  </div>
                  <div className="flex items-center gap-1">
                    <Wind className="w-4 h-4" />
                    {currentWeather.wind.speed} m/s
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-red-500">City not found.</div>
          )}
        </div>
      </div>

      {/* Forecast & Historical Graphs */}
      <div className="flex w-full max-w-4xl gap-4 flex-col md:flex-row">
        {/* 5-Year Weather Summary */}
        <div className="bg-base-100 shadow-xl rounded-xl p-6 w-full md:w-1/2">
          <h2 className="text-xl font-bold mb-4">5-Year Weather Summary</h2>
          <Line data={historicalChartData} />
          <div className="mt-4 space-y-1 text-sm text-gray-600">
            {seasonalSummary.map((summary, idx) => (
              <div key={idx}>• {summary}</div>
            ))}
          </div>
        </div>

        {/* 5-Day Forecast */}
        <div className="bg-base-100 shadow-xl rounded-xl p-6 w-full md:w-1/2">
          <h2 className="text-xl font-bold mb-4">5-Day Weather Forecast</h2>
          <Line data={forecastChartData} />
        </div>
      </div>
    </div>
  );
};

export default WeatherDashboard;
