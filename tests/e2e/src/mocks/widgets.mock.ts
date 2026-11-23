import { CurrencyCode } from "@_src/enums/currency.enum";
import { ExchangeRatesModel } from "@_src/models/exchange-rates.model";
import { CitySearchResultModel } from "@_src/models/weather-city.model";
import { CurrentWeatherModel } from "@_src/models/weather-widget.model";
import { convertToPln, findRate } from "@_src/utils/exchange-rate.util";
import { step } from "@_src/utils/step.decorator";
import { Page } from "@playwright/test";

// Podmienia w przeglądarce odpowiedzi endpointów, za którymi backend woła Open-Meteo i NBP.
// Zapis miasta (PUT /api/users/me/weather-city) i odczyt ustawień idą do prawdziwego backendu.
export class WidgetsMock {
  constructor(private page: Page) {}

  @step("Podstaw stałą pogodę dla miasta z ustawień użytkownika")
  async mockCurrentWeather(weather: CurrentWeatherModel): Promise<void> {
    await this.page.route(
      (url) => url.pathname === "/api/weather/current",
      async (route) => {
        const userUrl = new URL("/api/users/me", route.request().url()).toString();
        const userResponse = await route.fetch({ url: userUrl });
        const user = await userResponse.json();

        await route.fulfill({ json: { city: user.weather_city, weather } });
      },
    );
  }

  @step("Podstaw stałe wyniki wyszukiwania miast")
  async mockCitySearch(resultsByQuery: Record<string, CitySearchResultModel[]>): Promise<void> {
    await this.page.route(
      (url) => url.pathname === "/api/weather/cities",
      async (route) => {
        const query = new URL(route.request().url()).searchParams.get("query") ?? "";
        await route.fulfill({ json: resultsByQuery[query] ?? [] });
      },
    );
  }

  @step("Podstaw stałe kursy NBP i przeliczenia")
  async mockExchangeRates(exchangeRates: ExchangeRatesModel): Promise<void> {
    await this.page.route(
      (url) => url.pathname === "/api/exchange-rates",
      async (route) => {
        await route.fulfill({ json: exchangeRates });
      },
    );

    await this.page.route(
      (url) => url.pathname === "/api/exchange-rates/convert",
      async (route) => {
        const params = new URL(route.request().url()).searchParams;
        const amount = Number(params.get("amount"));
        const rate = findRate(exchangeRates, params.get("currency") as CurrencyCode);

        await route.fulfill({
          json: {
            amount,
            currency: rate.code,
            rate: rate.mid,
            amount_pln: convertToPln(amount, rate.mid),
            effective_date: exchangeRates.effective_date,
          },
        });
      },
    );
  }
}
