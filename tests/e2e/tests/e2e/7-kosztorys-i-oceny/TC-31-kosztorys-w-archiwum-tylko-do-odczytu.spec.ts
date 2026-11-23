import { TripSectionTab, TripStatusLabel } from "@_src/enums/trip.enum";
import { prepareMeal } from "@_src/factories/meal.factory";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { domesticTripData } from "@_src/test-data/trip.data";

test("TC-31 Kosztorys podróży w archiwum jest tylko do odczytu @logged", async ({ myTripsPage, tripsApi }) => {
  // given: Użytkownik ma zrealizowaną podróż z budżetem i posiłkiem, utworzoną przez API, i zna jej kosztorys.
  const trip = prepareTrip({ ...domesticTripData, planned_budget: 1000 });
  const expectedReadOnlyNotice = "Podróż jest w archiwum – można ją tylko przeglądać. Aby coś zmienić, cofnij status.";
  const expectedAlbumEmptyText = "Ta podróż nie ma jeszcze zdjęć.";

  const tripId = await tripsApi.createTrip(trip, "completed");
  const mealId = await tripsApi.createMeal(tripId, prepareMeal(trip));
  await myTripsPage.goto();
  const tripPage = await myTripsPage.clickTripCard(trip.name);
  const { sectionTabs, costSummary, mealsSection } = tripPage;

  const costSections = [
    { tab: TripSectionTab.Transport, section: tripPage.transportSection },
    { tab: TripSectionTab.Meals, section: mealsSection },
    { tab: TripSectionTab.Places, section: tripPage.placesSection },
    { tab: TripSectionTab.Expenses, section: tripPage.expensesSection },
  ];

  await sectionTabs.clickTab(TripSectionTab.Costs);

  const costSummaryBeforeArchive = await test.step("Zweryfikuj kosztorys przed archiwizacją", async () => {
    await expect(costSummary.total).toBeVisible();

    return costSummary.getCostSummary();
  });

  // when: Użytkownik przenosi podróż do archiwum.
  await tripPage.clickArchiveButton();

  // then: Kosztorys się nie zmienia, a sekcje kosztowe i album są tylko do odczytu.
  await test.step("Zweryfikuj podróż w archiwum", async () => {
    await expect(tripPage.tripStatus).toHaveText(TripStatusLabel.Archived);
    await expect(tripPage.readOnlyNotice).toHaveText(expectedReadOnlyNotice);
  });

  await sectionTabs.clickTab(TripSectionTab.Costs);

  await test.step("Zweryfikuj, że kosztorys się nie zmienił", async () => {
    await expect(costSummary.total).toHaveText(costSummaryBeforeArchive.total);
    await expect(costSummary.daily).toHaveText(costSummaryBeforeArchive.daily);
    await expect(costSummary.rating).toHaveText(costSummaryBeforeArchive.rating);
    await expect(costSummary.budget).toHaveText(costSummaryBeforeArchive.budget);
    await expect(costSummary.sectionsTable).toHaveText(costSummaryBeforeArchive.sections);
  });

  await sectionTabs.clickTab(TripSectionTab.Overview);

  await test.step("Zweryfikuj album bez możliwości dodania zdjęć", async () => {
    await expect(tripPage.album.emptyText).toContainText(expectedAlbumEmptyText);
    await expect(tripPage.album.addPhotosLink).toBeHidden();
  });

  for (const { tab, section } of costSections) {
    await sectionTabs.clickTab(tab);

    await test.step(`Zweryfikuj brak dodawania w zakładce „${tab}”`, async () => {
      await expect(section.section, "Sekcja jest wczytana, zanim sprawdzimy brak przycisku").toBeVisible();
      await expect(section.addButton).toBeHidden();
    });
  }

  await sectionTabs.clickTab(TripSectionTab.Meals);

  await test.step("Zweryfikuj posiłek bez przycisków edycji", async () => {
    await expect(mealsSection.getItem(mealId)).toBeVisible();
    await expect(mealsSection.getEditButton(mealId)).toBeHidden();
    await expect(mealsSection.getCopyButton(mealId)).toBeHidden();
    await expect(mealsSection.getDeleteButton(mealId)).toBeHidden();
  });

  // when: Użytkownik cofa status podróży z archiwum.
  await tripPage.clickRevertStatusButton();

  // then: W sekcjach kosztowych znowu można dodawać i edytować pozycje.
  await test.step("Zweryfikuj status po cofnięciu z archiwum", async () => {
    await expect(tripPage.tripStatus).toHaveText(TripStatusLabel.Completed);
  });

  for (const { tab, section } of costSections) {
    await sectionTabs.clickTab(tab);

    await test.step(`Zweryfikuj możliwość dodawania pozycji w zakładce „${tab}”`, async () => {
      await expect(section.addButton).toBeEnabled();
    });
  }

  await sectionTabs.clickTab(TripSectionTab.Meals);

  await test.step("Zweryfikuj przyciski edycji posiłku", async () => {
    await expect(mealsSection.getEditButton(mealId)).toBeEnabled();
    await expect(mealsSection.getCopyButton(mealId)).toBeEnabled();
    await expect(mealsSection.getDeleteButton(mealId)).toBeEnabled();
  });
});
