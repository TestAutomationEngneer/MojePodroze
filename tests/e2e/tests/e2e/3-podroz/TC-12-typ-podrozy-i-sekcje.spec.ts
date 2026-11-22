import { TripSectionTab, TripType } from "@_src/enums/trip.enum";
import { prepareFlight } from "@_src/factories/flight.factory";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { defaultPackingItems, domesticTripSectionTabs, foreignTripSectionTabs } from "@_src/test-data/trip-section.data";
import { domesticTripData, foreignTripData } from "@_src/test-data/trip.data";
import { getExpectedPackingProgress } from "@_src/utils/checklist.util";
import { getExpectedTripMetaText } from "@_src/utils/trip.util";

test("TC-12 Zakładki podróży zależą od jej typu, a loty blokują zmianę typu podróży na krajową @logged", async ({
  myTripsPage,
  tripsApi,
}) => {
  // given: Użytkownik ma podróż zagraniczną z lotem i podróż krajową, utworzone przez API.
  const foreignTrip = prepareTrip(foreignTripData);
  const domesticTrip = prepareTrip(domesticTripData);
  const expectedForeignMeta = getExpectedTripMetaText(foreignTrip);
  const expectedDomesticMeta = getExpectedTripMetaText({ ...foreignTrip, trip_type: TripType.Domestic });
  const expectedPackingProgress = getExpectedPackingProgress(0, defaultPackingItems.length);
  const expectedPackingTitle = "Lista pakowania";
  const expectedPackingNameLabel = "Rzecz do spakowania";
  const expectedDefaultItemBadge = "z listy domyślnej";
  const expectedFlightsEmptyText = "Nie dodano jeszcze żadnego lotu.";
  const expectedTypeChangeError =
    "Nie można zmienić typu podróży na „krajowa”, bo podróż ma pozycje w sekcji: Loty. Usuń je najpierw.";

  const foreignTripId = await tripsApi.createTrip(foreignTrip, "planned");
  const flightId = await tripsApi.createFlight(foreignTripId, prepareFlight(foreignTrip));
  const domesticTripId = await tripsApi.createTrip(domesticTrip, "planned");

  // when: Użytkownik otwiera podróż zagraniczną i zakładkę „Pakowanie”.
  await myTripsPage.goto();
  const tripPage = await myTripsPage.clickTripCard(foreignTrip.name);
  const { sectionTabs, packingSection, flightsSection } = tripPage;

  // then: Podróż zagraniczna ma zakładkę „Loty” i domyślną listę pakowania.
  await test.step("Zweryfikuj zakładki podróży zagranicznej", async () => {
    await expect(tripPage.tripTitle).toHaveText(foreignTrip.name);
    await expect(sectionTabs.tabs).toHaveText(foreignTripSectionTabs);
  });

  await sectionTabs.clickTab(TripSectionTab.Packing);

  await test.step("Zweryfikuj domyślną listę pakowania", async () => {
    await expect(packingSection.progress).toHaveText(expectedPackingProgress);
    await expect(packingSection.items).toContainText(defaultPackingItems);
    await expect(packingSection.items.filter({ hasText: expectedDefaultItemBadge })).toHaveCount(
      defaultPackingItems.length,
    );
  });

  // when: Użytkownik otwiera podróż krajową i zakładkę „Pakowanie”.
  await tripPage.gotoTrip(domesticTripId);

  // then: Podróż krajowa nie ma zakładki „Loty”, a lista pakowania pozwala dodawać rzeczy.
  await test.step("Zweryfikuj zakładki podróży krajowej", async () => {
    await expect(tripPage.tripTitle).toHaveText(domesticTrip.name);
    await expect(sectionTabs.tabs).toHaveText(domesticTripSectionTabs);
  });

  await sectionTabs.clickTab(TripSectionTab.Packing);

  await test.step("Zweryfikuj listę pakowania podróży krajowej", async () => {
    await expect(packingSection.title).toHaveText(expectedPackingTitle);
    await expect(packingSection.nameInput).toHaveAccessibleName(expectedPackingNameLabel);
    await expect(packingSection.addButton).toBeEnabled();
  });

  // when: Użytkownik zmienia typ podróży zagranicznej z lotem na krajową.
  await tripPage.gotoTrip(foreignTripId);
  let tripFormPage = await tripPage.clickEditButton();

  await test.step("Zweryfikuj wczytanie formularza edycji", async () => {
    await expect(tripFormPage.nameInput).toHaveValue(foreignTrip.name);
  });

  await tripFormPage.selectTripType(TripType.Domestic);
  await tripFormPage.clickSaveButton();

  // then: Zmiana jest zablokowana, bo podróż ma loty.
  await test.step("Zweryfikuj blokadę zmiany typu", async () => {
    await expect(tripFormPage.formError).toHaveText(expectedTypeChangeError);
    await expect(tripFormPage.typeError).toHaveText(expectedTypeChangeError);
  });

  // when: Użytkownik wychodzi z formularza bez zapisywania.
  const leaveDialog = await tripFormPage.clickCancelButton();
  await leaveDialog.clickConfirmButton();

  // then: Podróż nadal jest zagraniczna.
  await test.step("Zweryfikuj, że typ pozostał zagraniczny", async () => {
    await expect(tripPage.tripTitle).toHaveText(foreignTrip.name);
    await expect(tripPage.tripMeta).toHaveText(expectedForeignMeta);
  });

  // when: Użytkownik usuwa lot.
  await sectionTabs.clickTab(TripSectionTab.Flights);
  const deleteFlightDialog = await flightsSection.clickDeleteButton(flightId);
  await deleteFlightDialog.clickConfirmButton();

  // then: Zakładka „Loty” jest pusta.
  await test.step("Zweryfikuj usunięcie lotu", async () => {
    await expect(flightsSection.emptyText).toHaveText(expectedFlightsEmptyText);
  });

  // when: Użytkownik ponownie zmienia typ podróży na krajową.
  tripFormPage = await tripPage.clickEditButton();

  await test.step("Zweryfikuj wczytanie formularza edycji", async () => {
    await expect(tripFormPage.nameInput).toHaveValue(foreignTrip.name);
  });

  await tripFormPage.selectTripType(TripType.Domestic);
  await tripFormPage.clickSaveButton();

  // then: Podróż jest krajowa, znika zakładka „Loty”, a lista pakowania działa.
  await test.step("Zweryfikuj zmianę typu na krajowy", async () => {
    await expect(tripPage.tripTitle).toHaveText(foreignTrip.name);
    await expect(tripPage.tripMeta).toHaveText(expectedDomesticMeta);
    await expect(sectionTabs.tabs).toHaveText(domesticTripSectionTabs);
  });

  await sectionTabs.clickTab(TripSectionTab.Packing);

  await test.step("Zweryfikuj listę pakowania po zmianie na krajową", async () => {
    await expect(packingSection.title).toHaveText(expectedPackingTitle);
    await expect(packingSection.addButton).toBeEnabled();
  });

  // when: Użytkownik zmienia typ podróży z powrotem na zagraniczną.
  tripFormPage = await tripPage.clickEditButton();

  await test.step("Zweryfikuj wczytanie formularza edycji", async () => {
    await expect(tripFormPage.nameInput).toHaveValue(foreignTrip.name);
  });

  await tripFormPage.selectTripType(TripType.Foreign);
  await tripFormPage.clickSaveButton();

  // then: Wraca zakładka „Loty”, a domyślna lista pakowania się nie dubluje.
  await test.step("Zweryfikuj zmianę typu na zagraniczny", async () => {
    await expect(tripPage.tripTitle).toHaveText(foreignTrip.name);
    await expect(tripPage.tripMeta).toHaveText(expectedForeignMeta);
    await expect(sectionTabs.tabs).toHaveText(foreignTripSectionTabs);
  });

  await sectionTabs.clickTab(TripSectionTab.Packing);

  await test.step("Zweryfikuj, że domyślna lista pakowania się nie zdublowała", async () => {
    await expect(packingSection.progress).toHaveText(expectedPackingProgress);
  });
});
