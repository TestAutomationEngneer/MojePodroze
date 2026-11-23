import { CitySearchResultModel, WeatherCityModel } from "@_src/models/weather-city.model";
import { CurrentWeatherModel } from "@_src/models/weather-widget.model";

export function getExpectedCityName(city: WeatherCityModel): string {
  if (city.country === null) {
    return city.name;
  }

  return `${city.name}, ${city.country}`;
}

export function getExpectedSearchResultLabel(city: CitySearchResultModel): string {
  const parts = [city.name];

  if (city.region !== null) {
    parts.push(city.region);
  }

  if (city.country !== null) {
    parts.push(city.country);
  }

  return parts.join(", ");
}

export function getExpectedTemperatureText(weather: CurrentWeatherModel): string {
  return `${Math.round(weather.temperature_c)}°C ${weather.description.toLowerCase()}`;
}

export function getExpectedWeatherDetailsText(weather: CurrentWeatherModel): string {
  return `Odczuwalna ${Math.round(weather.apparent_temperature_c ?? 0)}°C · wiatr ${Math.round(weather.wind_speed_kmh ?? 0)} km/h`;
}
