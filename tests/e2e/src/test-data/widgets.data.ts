import { CurrencyCode } from "@_src/enums/currency.enum";
import { ExchangeRatesModel } from "@_src/models/exchange-rates.model";
import { CitySearchResultModel } from "@_src/models/weather-city.model";
import { CurrentWeatherModel } from "@_src/models/weather-widget.model";

// Stałe odpowiedzi widżetów (page.route). Testy E2E nie zależą od Open-Meteo i NBP – wynik
// byłby inny przy każdym uruchomieniu, a awaria zewnętrznego serwisu wywracałaby testy.

export const mockedCurrentWeather: CurrentWeatherModel = {
  temperature_c: 12.4,
  apparent_temperature_c: 10.6,
  relative_humidity: 70,
  wind_speed_kmh: 14.6,
  weather_code: 3,
  description: "Pochmurno",
  is_day: true,
  observed_at: "2026-11-20T12:00",
};

export const mockedCitySearchResults: Record<string, CitySearchResultModel[]> = {
  Kraków: [
    { name: "Kraków", region: "Małopolskie", country: "Polska", latitude: 50.0614, longitude: 19.9366 },
    { name: "Krakow", region: "Wisconsin", country: "Stany Zjednoczone", latitude: 44.7647, longitude: -88.0379 },
  ],
};

export const mockedExchangeRates: ExchangeRatesModel = {
  table_no: "225/A/NBP/2026",
  effective_date: "2026-11-20",
  rates: [
    { code: CurrencyCode.EUR, currency: "euro", mid: 4.2312 },
    { code: CurrencyCode.USD, currency: "dolar amerykański", mid: 3.6543 },
    { code: CurrencyCode.GBP, currency: "funt szterling", mid: 4.8123 },
  ],
};
