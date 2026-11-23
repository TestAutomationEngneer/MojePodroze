# Standardy pisania testów E2E

Zasady obowiązujące w testach Playwright w katalogu `tests/e2e`. Przypadki testowe, na których
opierają się testy, są w `tests/manual`.

## Struktura projektu

| Katalog | Zawartość |
|---|---|
| `config/` | zmienne środowiskowe i strefa czasowa (`env.config.ts`), ścieżka sesji (`storage-state.config.ts`), logowanie przed testami (`global.setup.ts`) |
| `src/pages/` | page objecty: ekrany z własnym adresem, dziedziczą po `BasePage` |
| `src/components/` | części ekranu z własnymi elementami: menu, zakładki, widgety |
| `src/views/` | formularze i panele bez własnego adresu |
| `src/fixtures/` | fixture'y; testy importują `test` i `expect` z `merge.fixture.ts` |
| `src/api/` | klienci API do przygotowania danych testowych |
| `src/mocks/` | podmiana odpowiedzi API w przeglądarce (`page.route`), np. widżety pogody i kursów |
| `src/assertions/` | wspólne grupy asercji używane w kilku testach, np. `verifyTripOnList` |
| `src/enums/` | stałe zestawy wartości, np. etykiety statusów |
| `src/models/` | interfejsy danych |
| `src/factories/` | funkcje tworzące losowe dane testowe |
| `src/test-data/` | stałe dane testowe, np. użytkownik testowy, odpowiedzi mocków |
| `src/utils/` | narzędzia, np. dekorator `step`, formatowanie oczekiwanych wartości |
| `tests/smoke/` | testy smoke |
| `tests/e2e/` | testy przypadków testowych z `tests/manual` |
| `tmp/` | zapisana sesja, plik ignorowany przez gita |

Nazwy plików piszemy w kebab-case z przyrostkiem typu: `my-trips.page.ts`,
`main-menu.component.ts`, `add-flight.view.ts`, `user.model.ts`, `widgets.mock.ts`,
`trip.assertions.ts`, `login.spec.ts`.

Plik testu przypadku testowego zaczyna się od jego numeru, a reszta nazwy jest bez polskich znaków:
`TC-05-podroze-w-grupach-wedlug-statusu.spec.ts`. Plik z wariantami jednego przypadku ma numer
przypadku bez numeru wariantu: `TC-10-dodanie-podrozy.spec.ts` (testy TC-10-1 i TC-10-2).

Plików konfiguracyjnych (`playwright.config.ts`) nie importujemy w testach ani w `src/` – wspólne
stałe trzymamy w `config/`.

## Nazwy

Kod i identyfikatory są po angielsku. Tytuły testów, nazwy kroków, opisy asercji i komentarze
given/when/then są po polsku.

| Element | Zapis | Przykład |
|---|---|---|
| Model | PascalCase z przyrostkiem `Model` | `LoginUserModel` |
| Lokator | camelCase, opisowo | `newTripButton`, `statsTab`, `weatherWidget` |
| Metoda | camelCase, `czasownikRzeczownik` | `clickStatsTab`, `login` |
| Oczekiwana wartość | camelCase z przedrostkiem `expected` | `expectedRatesTitle` |
| Wspólna grupa asercji | `verify…` | `verifyTripDetails` |

Tytuł testu:

* zaczyna się wielką literą i opisuje zachowanie w czasie teraźniejszym, bez „powinien”,
* zaczyna się od tego, kto działa („Użytkownik…”), albo czego dotyczy reguła („Formularz…”,
  „Podróż w archiwum…”),
* w teście przypadku testowego ma na początku numer przypadku, a dalej ten sam tytuł co w `tests/manual`.

```typescript
// ✅
test("TC-05 Podróże wyświetlają się w grupach według statusu @logged", ...);
test("TC-10-1 Użytkownik dodaje podróż krajową przez formularz @logged", ...);
test("TC-11 Formularz podróży odrzuca błędne dane, a po poprawieniu zapisuje podróż @logged", ...);
test("Logowanie poprawnymi danymi otwiera stronę Moje podróże @smoke", ...);

// ❌
test("test logowania", ...);
test("Powinien dodać podróż", ...);
```

## Selektory

Kolejność wyboru:

1. `getByTestId` – także z wyrażeniem regularnym dla rodziny elementów, np.
   `getByTestId(/^status-tab-/)` albo `item.getByTestId(/^btn-edit-/)` (przycisk w wierszu, gdy nie znamy id),
2. `id`, np. `locator("#menu-toggle")`,
3. `getByRole` **bez nazwy** albo z nazwą będącą danymi testu (np. nazwa podróży w nagłówku karty).

Nie używamy selektorów opartych na klasach CSS. Napis na przycisku, linku, zakładce czy nagłówku
nie jest częścią selektora, tylko ewentualnej asercji – zmiana napisu nie może psuć wszystkich
testów, które używają tego elementu. Stan elementu (`aria-current`, `aria-selected`, `data-level`)
sprawdzamy asercją `toHaveAttribute`, a nie selektorem atrybutu.

Brakujący `data-testid` dodajemy w aplikacji i dopisujemy do listy w `docs/design/README.md`.

## Page objecty, komponenty i views

| | Page | Component | View |
|---|---|---|---|
| Opisuje | cały ekran z adresem | część ekranu | formularz lub panel |
| Dziedziczy po `BasePage` | tak | nie | nie |
| `url` i `goto()` | tak | nie | nie |

* Komponenty są polami page objectu: `myTripsPage.mainMenu`, `myTripsPage.statusTabs`.
* Page object udostępnia lokatory. Asercje piszemy w testach albo we wspólnych grupach asercji
  w `src/assertions/` – nigdy w page objectach.
* Metoda, która **przechodzi na inny ekran**, zwraca jego page object.
* Gdy adres ekranu zależy od id, page object ma metodę z parametrem zamiast `goto()`, np.
  `tripPage.gotoTrip(tripId)`, `tripPage.getUrl(tripId)`.

```typescript
// ✅
async clickStatsTab(): Promise<StatsPage> {
  await this.statsTab.click();
  return new StatsPage(this.page);
}

// ❌
async clickStatsTab(): Promise<void> {
  await this.statsTab.click();
}
```

W teście korzystamy ze zwróconego obiektu, zamiast tworzyć go ręcznie:

```typescript
// ✅
const statsPage = await myTripsPage.mainMenu.clickStatsTab();

// ❌
await myTripsPage.mainMenu.clickStatsTab();
const statsPage = new StatsPage(page);
```

* Szczegóły techniczne aplikacji ukrywamy w page objecie. Przykład: test używa
  `sectionTabs.clickTab(TripSectionTab.Meals)`, a mapowanie na `data-testid` jest w komponencie.
* Metody odczytujące migawkę (`getAllTripCards`, `getTabs`, `getCostSummary`) służą tylko do
  porównań, których nie da się wyrazić jednym lokatorem, albo do zapamiętania stanu wyjściowego.
* Modyfikatory dostępu dodajemy tylko wtedy, gdy są potrzebne, np. `constructor(private page: Page)`.

## Fixture'y

* Fixture'y tworzymy tylko dla ekranów, od których zaczynają się testy, np. `loginPage`, `myTripsPage`.
* Fixture'y **nie otwierają strony**. Test woła `goto()` sam, po przygotowaniu danych przez API –
  dzięki temu strona jest otwierana raz i już z danymi testu.
* W teście wywoływany jest **jeden** page z fixture'a. Do kolejnych przechodzimy
  przez metody zwracające page objecty.
* `widgetsMock` podstawia stałe odpowiedzi pogody i kursów NBP (patrz „Zewnętrzne API”).
* Nowy zestaw fixture'ów dopisujemy w `merge.fixture.ts`.

## Zewnętrzne API

Testy E2E nie zależą od Open-Meteo ani NBP: wynik zmieniałby się przy każdym uruchomieniu, a awaria
zewnętrznego serwisu wywracałaby testy. Endpointy backendu, które z nich korzystają
(`/api/weather/current`, `/api/weather/cities`, `/api/exchange-rates`, `/api/exchange-rates/convert`),
podmieniamy w przeglądarce przez `widgetsMock` (`page.route`) danymi z `src/test-data/widgets.data.ts`.
Zapis ustawień użytkownika (np. miasta pogody) idzie do prawdziwego backendu.

## Kroki w raporcie

**Akcje** opisuje dekorator `@step` przy metodach page objectów. Nazwa jest w trybie rozkazującym:

```typescript
@step("Zaloguj użytkownika")
async login(loginUserData: LoginUserModel): Promise<MyTripsPage> { ... }

@step((tripId: number) => `Otwórz podróż ${tripId}`)
async gotoTrip(tripId: number): Promise<void> { ... }
```

W nazwie kroku nigdy nie umieszczamy loginu ani hasła.

**Asercje** grupujemy w `test.step` z nazwą zaczynającą się od „Zweryfikuj”. Jeden krok obejmuje
grupę powiązanych asercji, a nie pojedynczy `expect`:

```typescript
await test.step("Zweryfikuj widget kursów NBP", async () => {
  await expect(ratesWidget.title).toHaveText(expectedRatesTitle);
  await expect(ratesWidget.ratesList).toBeVisible();
});
```

Akcji w teście nie wrapujemy w `test.step`. Wyjątkiem są długie przypadki testowe, np. TC-32, gdzie
`test.step` może połączyć kilka metod w jeden etap.

## Asercje

Używamy wyłącznie asercji z automatycznym ponawianiem na lokatorach:

```typescript
// ✅
await expect(newTripButton).toBeVisible();
await expect(myTripsPage.getCardStatus(tripName)).toHaveText(TripStatusLabel.Planned);

// ❌ odczyt w jednej chwili – jeśli lista jeszcze się nie przerysowała, test porówna stare dane
expect(await newTripButton.isVisible()).toBe(true);
const card = await myTripsPage.getTripCard(tripName);
expect(card.status).toBe(TripStatusLabel.Planned);
```

Gdy oczekiwanej wartości nie da się sprawdzić jednym lokatorem (np. kolejność kart), odczyt
i porównanie wkładamy w `expect(...).toPass()`, żeby były ponawiane:

```typescript
await expect(async () => {
  const cards = await myTripsPage.getAllTripCards();
  expect(cards).toEqual(getExpectedCardsOrder(cards));
}).toPass();
```

Asercja negatywna (`toBeHidden`, `toHaveCount(0)`, `not.…`) musi mieć **kotwicę**: wcześniej
w tym samym kroku sprawdzamy coś pozytywnego, co potwierdza, że ekran już się zmienił. Inaczej
asercja przejdzie, zanim zakładka się wyrenderuje, i niczego nie sprawdzi.

```typescript
// ✅
await expect(section.section).toBeVisible();
await expect(section.addButton).toBeHidden();

// ❌ przejdzie także wtedy, gdy zakładka jeszcze się nie otworzyła
await expect(section.addButton).toBeHidden();
```

Nie używamy `waitForTimeout`.

| Co sprawdzamy | Asercja |
|---|---|
| Element jest widoczny | `toBeVisible` |
| Element zniknął | `toBeHidden` |
| Dokładny tekst | `toHaveText` |
| Tekst z częścią zmienną, np. licznikiem | `toContainText` |
| Wartość pola formularza | `toHaveValue` |
| Liczba elementów | `toHaveCount` |
| Adres i tytuł strony | `toHaveURL`, `toHaveTitle` |
| Przycisk aktywny lub zablokowany | `toBeEnabled`, `toBeDisabled` |
| Atrybut, stan ARIA, `data-level` | `toHaveAttribute` |

* `expect` przerywa test przy błędzie. `expect.soft` stosujemy przy kilku niezależnych sprawdzeniach.
* **Testy smoke** sprawdzają, czy główne obszary ekranu są na miejscu: `toBeVisible`, a tekst tylko
  tam, gdzie mówi, co to za obszar, np. tytuły widgetów i nazwy zakładek.
* **Testy przypadków testowych** sprawdzają to, co jest celem testu: komunikaty, kwoty, statusy, nazwy
  pozycji. Nie sprawdzamy napisów na przyciskach, które tylko klikamy.
* Gdy celem jest napis przycisku, zakładki lub nagłówka, najpierw `toBeVisible`, potem `toContainText`.

## Oczekiwane wartości

Oczekiwane wartości trzymamy w stałych `expected...` na początku testu:

```typescript
// ✅
const expectedRatesTitle = "Kursy NBP";
await expect(ratesWidget.title).toHaveText(expectedRatesTitle);

// ❌
await expect(ratesWidget.title).toHaveText("Kursy NBP");
```

## Opisy asercji

Opis dodajemy tylko wtedy, gdy z samej asercji nie wynika, co jest sprawdzane. Jeśli opis zawiera
oczekiwaną wartość, używa tej samej stałej co asercja:

```typescript
// ✅ atrybut aria-current nic nie mówi czytelnikowi
await expect(mainMenu.myTripsTab, "Aktywna zakładka menu to „Moje podróże”").toHaveAttribute("aria-current", "page");

// ✅ data-testid mówi, co jest sprawdzane
await expect(mainMenu.logoutButton).toBeVisible();

// ❌ opis powtarza to, co widać w kodzie
await expect(mainMenu.logoutButton, "Przycisk Wyloguj jest widoczny").toBeVisible();
```

## Układ testu: given / when / then

Test ma kolejno: przygotowanie, akcję i sprawdzenie. Każdą część poprzedza komentarz
`// given:`, `// when:` albo `// then:` z **najwyżej jednym zdaniem** wyjaśnienia, co się dzieje
z punktu widzenia użytkownika. Części rozdzielamy pustą linią.

W długich przypadkach testowych (np. TC-05, TC-13, TC-32) para `// when:` / `// then:` powtarza się
przy każdym kolejnym etapie scenariusza. Krótkie kroki pomocnicze (np. „Zweryfikuj wczytanie
formularza”) nie potrzebują osobnego komentarza.

```typescript
test("TC-10-1 Użytkownik dodaje podróż krajową przez formularz @logged", async ({ myTripsPage }) => {
  // given: Użytkownik jest na liście podróży.
  const trip = prepareTrip(domesticTripData);
  await myTripsPage.goto();

  // when: Użytkownik wypełnia i zapisuje formularz nowej podróży.
  const tripFormPage = await myTripsPage.clickNewTripButton();
  myTripsPage = await tripFormPage.createTrip(trip);

  // then: Podróż jest na liście ze statusem „W planie”.
  await test.step("Zweryfikuj kartę podróży", async () => {
    await expect(myTripsPage.getCardStatus(trip.name)).toHaveText(TripStatusLabel.Planned);
  });
});
```

## Niezależność testów

* Każdy przypadek testowy jest w osobnym pliku. Warianty jednego przypadku (te same kroki, inne
  dane, np. podróż krajowa i zagraniczna) są w jednym pliku jako pętla po tablicy wariantów
  – każdy wariant to osobny `test` z własnym numerem w tytule.
* Nie używamy `test.describe.configure({ mode: "serial" })`.
* Żaden test nie korzysta z danych utworzonych przez inny test.
* Testy z `@logged` korzystają z jednego użytkownika testowego, dlatego dane izolujemy unikalnymi
  wartościami. Nazwy i miasta dostają unikalną końcówkę, np. `Kraków-a1b2`.
* Po każdym teście fixture `tripsApi` usuwa przez API podróże, które test utworzył. Podróże tworzone
  przez API są zapisywane automatycznie, a utworzone w formularzu test zgłasza przez
  `tripsApi.addTripToCleanup(nazwa)`.
* Testy uruchamiamy na jednym workerze (`workers: 1`), bo część z nich zmienia wspólny stan
  użytkownika, np. miasto pogody.

## Daty i strefa czasowa

Testy liczą daty („dziś”, „za 30 dni”) w strefie `Europe/Warsaw` – tej samej, którą dostaje
przeglądarka (`timezoneId`). Ustawia ją `config/env.config.ts` (`process.env.TZ`), więc wyniki nie
zależą od strefy maszyny, np. runnera CI w UTC.

## Tagi

| Tag | Znaczenie |
|---|---|
| `@smoke` | test smoke |
| `@logged` | test wymaga zalogowanego użytkownika i korzysta z zapisanej sesji |

W PowerShellu tag trzeba podać w cudzysłowie:

```
npx playwright test --grep "@smoke"
```

Pojedynczy przypadek testowy uruchamiamy po numerze z tytułu:

```
npx playwright test --grep "TC-05"
```

## Dane logowania

* Login i hasło są wyłącznie w pliku `.env`, którego nie dodajemy do repozytorium. Wzór jest
  w `.env.template`.
* Użytkownik testowy jest logowany raz, w `config/global.setup.ts`, poza raportem.
