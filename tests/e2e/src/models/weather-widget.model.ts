export interface CurrentWeatherModel {
  temperature_c: number;
  apparent_temperature_c: number | null;
  relative_humidity: number | null;
  wind_speed_kmh: number | null;
  weather_code: number;
  description: string;
  is_day: boolean | null;
  observed_at: string;
}
