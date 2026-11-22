import { CurrencyCode } from "@_src/enums/currency.enum";
import { TripStatusLabel } from "@_src/enums/trip.enum";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { mockedExchangeRates } from "@_src/test-data/widgets.data";
import {
  findRate,
  formatRate,
  getExpectedConversionText,
  getExpectedRateButtonText,
  getExpectedRatesDateText,
} from "@_src/utils/exchange-rate.util";
import { formatAmount } from "@_src/utils/money.util";

test("TC-07 Widżet kursów NBP pokazuje kursy i przelicza kwotę na PLN @logged", async ({ myTripsPage, widgetsMock }) => {
  // given: Kursy NBP mają stałe wartości z danych testowych.
  const defaultAmount = 100;
  const amount = 12.5;
  const invalidAmounts = ["-5", "abc", "1,234"];
  const statusTabs = [
    TripStatusLabel.Planned,
    TripStatusLabel.InProgress,
    TripStatusLabel.Completed,
    TripStatusLabel.Archived,
  ];

  const euroRate = findRate(mockedExchangeRates, CurrencyCode.EUR);
  const dollarRate = findRate(mockedExchangeRates, CurrencyCode.USD);
  const poundRate = findRate(mockedExchangeRates, CurrencyCode.GBP);

  const expectedEuroButton = getExpectedRateButtonText(euroRate);
  const expectedDollarButton = getExpectedRateButtonText(dollarRate);
  const expectedPoundButton = getExpectedRateButtonText(poundRate);
  const expectedRateButtons = [expectedEuroButton, expectedDollarButton, expectedPoundButton];
  const expectedRatesDate = getExpectedRatesDateText(mockedExchangeRates);
  const expectedEuroAmountLabel = `Kwota w ${euroRate.code}`;
  const expectedDollarAmountLabel = `Kwota w ${dollarRate.code}`;
  const expectedDefaultAmountInEuro = getExpectedConversionText(defaultAmount, euroRate);
  const expectedDefaultAmountInDollars = getExpectedConversionText(defaultAmount, dollarRate);
  const expectedAmountInDollars = getExpectedConversionText(amount, dollarRate);
  const expectedAmountInPounds = getExpectedConversionText(amount, poundRate);
  const expectedDefaultAmountInPounds = getExpectedConversionText(defaultAmount, poundRate);
  const expectedAmountError = "Podaj kwotę, np. 100 albo 12,50.";
  const expectedEmptyResult = "= –";
  const { ratesWidget } = myTripsPage;

  await widgetsMock.mockExchangeRates(mockedExchangeRates);

  // when: Użytkownik otwiera stronę „Moje podróże”.
  await myTripsPage.goto();

  // then: Widżet pokazuje kursy z tabeli NBP i domyślnie przelicza 100 EUR.
  await test.step("Zweryfikuj kursy i datę tabeli NBP", async () => {
    await expect(ratesWidget.rateButtons).toHaveText(expectedRateButtons);
    await expect(ratesWidget.ratesDate).toHaveText(expectedRatesDate);
  });

  await test.step("Zweryfikuj domyślne ustawienia kalkulatora", async () => {
    await expect(ratesWidget.selectedRateButton, `Domyślnie zaznaczona powinna być waluta ${euroRate.code}`).toHaveText(
      expectedEuroButton,
    );
    await expect(ratesWidget.amountInput).toHaveAccessibleName(expectedEuroAmountLabel);
    await expect(ratesWidget.amountInput).toHaveValue(String(defaultAmount));
    await expect(
      ratesWidget.convertResult,
      `Wynik powinien być równy ${defaultAmount} × ${formatRate(euroRate.mid)} (kurs ${euroRate.code})`,
    ).toHaveText(expectedDefaultAmountInEuro);
  });

  // when: Użytkownik wybiera walutę USD.
  await ratesWidget.clickRateButton(dollarRate.code);

  // then: Kalkulator przelicza kwotę po kursie USD.
  await test.step(`Zweryfikuj przeliczenie kwoty ${defaultAmount} po kursie ${dollarRate.code}`, async () => {
    await expect(ratesWidget.selectedRateButton, `Zaznaczona powinna być waluta ${dollarRate.code}`).toHaveText(
      expectedDollarButton,
    );
    await expect(ratesWidget.amountInput).toHaveAccessibleName(expectedDollarAmountLabel);
    await expect(
      ratesWidget.convertResult,
      `Wynik powinien być równy ${defaultAmount} × ${formatRate(dollarRate.mid)} (kurs ${dollarRate.code})`,
    ).toHaveText(expectedDefaultAmountInDollars);
  });

  // when: Użytkownik wpisuje kwotę z groszami.
  await ratesWidget.fillAmount(formatAmount(amount));

  // then: Wynik jest zaokrąglony do groszy.
  await test.step(`Zweryfikuj przeliczenie kwoty ${formatAmount(amount)} po kursie ${dollarRate.code}`, async () => {
    await expect(
      ratesWidget.convertResult,
      `Wynik powinien być równy ${formatAmount(amount)} × ${formatRate(dollarRate.mid)} (kurs ${dollarRate.code}), zaokrąglony do groszy`,
    ).toHaveText(expectedAmountInDollars);
  });

  // when: Użytkownik zmienia walutę na GBP.
  await ratesWidget.clickRateButton(poundRate.code);

  // then: Ta sama kwota jest przeliczona po kursie GBP.
  await test.step(`Zweryfikuj przeliczenie kwoty ${formatAmount(amount)} po kursie ${poundRate.code}`, async () => {
    await expect(ratesWidget.selectedRateButton, `Zaznaczona powinna być waluta ${poundRate.code}`).toHaveText(
      expectedPoundButton,
    );
    await expect(
      ratesWidget.convertResult,
      `Wynik powinien być równy ${formatAmount(amount)} × ${formatRate(poundRate.mid)} (kurs ${poundRate.code}), zaokrąglony do groszy`,
    ).toHaveText(expectedAmountInPounds);
  });

  // when: Użytkownik wpisuje kolejno błędne kwoty.
  for (const invalidAmount of invalidAmounts) {
    await ratesWidget.fillAmount(invalidAmount);

    // then: Kalkulator pokazuje błąd i nie podaje wyniku.
    await test.step(`Zweryfikuj błąd dla kwoty „${invalidAmount}”`, async () => {
      await expect(ratesWidget.amountError).toHaveText(expectedAmountError);
      await expect(ratesWidget.convertResult).toHaveText(expectedEmptyResult);
    });
  }

  // when: Użytkownik poprawia kwotę.
  await ratesWidget.fillAmount(String(defaultAmount));

  // then: Błąd znika, a wynik jest znowu przeliczony.
  await test.step("Zweryfikuj przeliczenie po poprawieniu kwoty", async () => {
    await expect(
      ratesWidget.convertResult,
      `Wynik powinien być równy ${defaultAmount} × ${formatRate(poundRate.mid)} (kurs ${poundRate.code})`,
    ).toHaveText(expectedDefaultAmountInPounds);
    await expect(ratesWidget.amountError).toBeHidden();
  });

  // when: Użytkownik przełącza zakładki statusów podróży.
  for (const status of statusTabs) {
    await myTripsPage.statusTabs.clickTabForStatus(status);

    // then: Widżet kursów jest widoczny niezależnie od zakładki.
    await test.step(`Zweryfikuj widżet kursów w zakładce „${status}”`, async () => {
      await expect(ratesWidget.rateButtons).toHaveText(expectedRateButtons);
      await expect(ratesWidget.ratesDate).toHaveText(expectedRatesDate);
    });
  }
});
