import { expect, test } from "@_src/fixtures/merge.fixture";
import { testUser1 } from "@_src/test-data/user.data";
import { mockedCitySearchResults, mockedCurrentWeather } from "@_src/test-data/widgets.data";
import {
  getExpectedCityName,
  getExpectedSearchResultLabel,
  getExpectedTemperatureText,
  getExpectedWeatherDetailsText,
} from "@_src/utils/weather.util";

test.use({ trace: "off" });

test("TC-06 Po zmianie miasta w widżecie pogody, wybór zostaje zapamiętany @logged", async ({
  myTripsPage,
  widgetsApi,
  widgetsMock,
}) => {
  // given: Pogoda i wyszukiwarka miast mają stałe odpowiedzi, a miasto użytkownika jest zapamiętane do przywrócenia.
  const tooShortQuery = "K";
  const unknownCity = "Qwxzyv";
  const cityQuery = "Kraków";
  const foundCities = mockedCitySearchResults[cityQuery];
  const chosenCityIndex = 0;
  const chosenCity = foundCities[chosenCityIndex];

  const initialCity = await widgetsApi.rememberWeatherCityToRestore();
  await widgetsMock.mockCurrentWeather(mockedCurrentWeather);
  await widgetsMock.mockCitySearch(mockedCitySearchResults);

  const expectedInitialCityName = getExpectedCityName(initialCity);
  const expectedSearchResults = foundCities.map((city) => getExpectedSearchResultLabel(city));
  const expectedChosenCityName = getExpectedCityName(chosenCity);
  const expectedWeatherLines = [
    getExpectedTemperatureText(mockedCurrentWeather),
    getExpectedWeatherDetailsText(mockedCurrentWeather),
  ];
  const expectedTooShortQueryError = "Wpisz co najmniej 2 litery nazwy miasta.";
  const expectedUnknownCityError = `Nie znaleziono miasta „${unknownCity}”.`;
  const { weatherWidget } = myTripsPage;

  // when: Użytkownik otwiera stronę „Moje podróże”.
  await myTripsPage.goto();

  // then: Widżet pokazuje pogodę dla miasta z ustawień użytkownika.
  await test.step("Zweryfikuj pogodę dla miasta zapisanego w ustawieniach", async () => {
    await expect(weatherWidget.currentWeatherLines).toHaveText([expectedInitialCityName, ...expectedWeatherLines]);
  });

  // when: Użytkownik szuka miasta po jednej literze.
  await weatherWidget.searchCity(tooShortQuery);

  // then: Widżet prosi o co najmniej 2 litery i nie zmienia miasta.
  await test.step("Zweryfikuj błąd zbyt krótkiej nazwy miasta", async () => {
    await expect(weatherWidget.searchError).toHaveText(expectedTooShortQueryError);
    await expect(weatherWidget.cityName).toHaveText(expectedInitialCityName);
  });

  // when: Użytkownik szuka miasta, które nie istnieje.
  await weatherWidget.searchCity(unknownCity);

  // then: Widżet informuje, że nie znalazł miasta.
  await test.step("Zweryfikuj błąd nieznalezionego miasta", async () => {
    await expect(weatherWidget.searchError).toHaveText(expectedUnknownCityError);
  });

  // when: Użytkownik szuka istniejącego miasta.
  await weatherWidget.searchCity(cityQuery);

  // then: Widżet pokazuje listę znalezionych miast.
  await test.step(`Zweryfikuj listę miast dla „${cityQuery}”`, async () => {
    await expect(weatherWidget.cityOptions).toHaveText(expectedSearchResults);
    await expect(weatherWidget.searchError).toBeHidden();
  });

  // when: Użytkownik wybiera pierwsze miasto z listy.
  await weatherWidget.clickCityOption(chosenCityIndex);

  // then: Widżet pokazuje pogodę dla wybranego miasta, a lista wyników znika.
  await test.step("Zweryfikuj pogodę dla wybranego miasta", async () => {
    await expect(weatherWidget.currentWeatherLines).toHaveText([expectedChosenCityName, ...expectedWeatherLines]);
    await expect(weatherWidget.cityResults).toBeHidden();
    await expect(weatherWidget.cityInput).toHaveValue("");
  });

  // when: Użytkownik odświeża stronę.
  await myTripsPage.reload();

  // then: Wybrane miasto zostaje w widżecie.
  await test.step("Zweryfikuj miasto po odświeżeniu strony", async () => {
    await expect(weatherWidget.currentWeatherLines).toHaveText([expectedChosenCityName, ...expectedWeatherLines]);
  });

  // when: Użytkownik wylogowuje się i loguje ponownie.
  const loginPage = await myTripsPage.mainMenu.clickLogoutButton();
  myTripsPage = await loginPage.login(testUser1);

  // then: Wybrane miasto jest zapisane w ustawieniach użytkownika.
  await test.step("Zweryfikuj miasto po ponownym zalogowaniu", async () => {
    await expect(
      myTripsPage.weatherWidget.currentWeatherLines,
      "Wybór miasta powinien być zapisany w ustawieniach użytkownika",
    ).toHaveText([expectedChosenCityName, ...expectedWeatherLines]);
  });
});
