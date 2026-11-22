import { step } from "@_src/utils/step.decorator";
import { Locator, Page } from "@playwright/test";

export class WeatherWidgetComponent {
  container: Locator;
  title: Locator;
  currentWeather: Locator;
  currentWeatherLines: Locator;
  cityName: Locator;
  cityInput: Locator;
  searchButton: Locator;
  searchError: Locator;
  cityResults: Locator;
  cityOptions: Locator;

  constructor(private page: Page) {
    this.container = this.page.getByTestId("widget-weather");
    this.title = this.container.getByRole("heading");
    this.currentWeather = this.page.getByTestId("weather-current");
    this.currentWeatherLines = this.currentWeather.getByRole("paragraph");
    this.cityName = this.page.getByTestId("weather-city-name");
    this.cityInput = this.page.getByTestId("input-weather-city");
    this.searchButton = this.page.getByTestId("btn-weather-search");
    this.searchError = this.page.getByTestId("weather-search-error");
    this.cityResults = this.page.getByTestId("weather-city-results");
    this.cityOptions = this.page.getByTestId(/^weather-city-option-/);
  }

  getCityOption(index: number): Locator {
    return this.page.getByTestId(`weather-city-option-${index}`);
  }

  @step((query: string) => `Wyszukaj miasto „${query}” w widżecie pogody`)
  async searchCity(query: string): Promise<void> {
    await this.cityInput.fill(query);
    await this.searchButton.click();
  }

  @step((index: number) => `Wybierz miasto nr ${index + 1} z wyników wyszukiwania`)
  async clickCityOption(index: number): Promise<void> {
    await this.getCityOption(index).click();
  }
}
