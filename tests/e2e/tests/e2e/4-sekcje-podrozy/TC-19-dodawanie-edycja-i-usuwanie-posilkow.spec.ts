import { RatingStars } from "@_src/enums/rating.enum";
import { TripSectionTab } from "@_src/enums/trip.enum";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { MealFormModel } from "@_src/models/meal-form.model";
import { domesticTripData } from "@_src/test-data/trip.data";
import { formatTripCardDate, getTripDayDate } from "@_src/utils/date.util";
import { formatAmount, formatMoney } from "@_src/utils/money.util";

test("TC-19 Użytkownik dodaje, edytuje i usuwa posiłki z oceną restauracji @logged", async ({
  myTripsPage,
  tripsApi,
}) => {
  // given: Użytkownik ma podróż krajową bez posiłków, utworzoną przez API.
  const trip = prepareTrip(domesticTripData);
  const day2 = getTripDayDate(trip.start_date, 2);
  const day3 = getTripDayDate(trip.start_date, 3);
  const pierogiCost = 62.5;
  const editedPierogiCost = 48;
  const zupaCost = 0;
  const negativeCost = "-10";
  const pierogi: MealFormModel = {
    dish: "Pierogi",
    restaurant: "Pierogarnia Mandu",
    date: day2,
    cost: formatAmount(pierogiCost),
    rating: "5",
  };
  const editedPierogi: MealFormModel = {
    dish: "Pierogi ruskie",
    restaurant: "Zapiecek",
    date: day3,
    cost: formatAmount(editedPierogiCost),
    rating: "4",
  };
  const zupa: MealFormModel = {
    dish: "Zupa rybna",
    restaurant: "Bar przy plaży",
    date: day3,
    cost: formatAmount(zupaCost),
    rating: "",
  };

  const expectedFormError = "Popraw zaznaczone pola.";
  const expectedDishError = "Podaj, co było jedzone.";
  const expectedRestaurantError = "Podaj nazwę restauracji.";
  const expectedCostError = "Podaj kwotę, np. 45 albo 45,50.";
  const expectedRatingLabel = "Ocena restauracji";
  const expectedEditFormTitle = "Edytuj posiłek";
  const expectedCostInEditForm = "62,5";
  const expectedNoRating = "bez oceny";

  await tripsApi.createTrip(trip, "planned");
  await myTripsPage.goto();
  const tripPage = await myTripsPage.clickTripCard(trip.name);
  const { mealsSection } = tripPage;

  // when: Użytkownik zapisuje pusty formularz posiłku.
  await tripPage.sectionTabs.clickTab(TripSectionTab.Meals);
  await mealsSection.clickAddButton();
  await mealsSection.clickSaveButton();

  // then: Formularz wskazuje wymagane pola i ma jedno pole oceny – ocenę restauracji.
  await test.step("Zweryfikuj błędy pustego formularza", async () => {
    await expect(mealsSection.formError).toHaveText(expectedFormError);
    await expect(mealsSection.dishError).toHaveText(expectedDishError);
    await expect(mealsSection.restaurantError).toHaveText(expectedRestaurantError);
    await expect(mealsSection.costError).toHaveText(expectedCostError);
  });

  await test.step("Zweryfikuj jedno pole oceny restauracji", async () => {
    await expect(mealsSection.formSelects).toHaveCount(1);
    await expect(mealsSection.ratingSelect).toHaveAccessibleName(expectedRatingLabel);
  });

  // when: Użytkownik wpisuje ujemny koszt.
  await mealsSection.fillForm({ ...pierogi, cost: negativeCost });
  await mealsSection.clickSaveButton();

  // then: Formularz odrzuca ujemny koszt.
  await test.step("Zweryfikuj błąd ujemnego kosztu", async () => {
    await expect(mealsSection.costError).toHaveText(expectedCostError);
  });

  // when: Użytkownik zapisuje poprawny posiłek.
  await mealsSection.fillForm(pierogi);
  await mealsSection.clickSaveButton();

  // then: Posiłek jest na liście z restauracją, datą, oceną i kosztem.
  await test.step("Zweryfikuj dodany posiłek", async () => {
    const pierogiItem = mealsSection.getItemByTitle(pierogi.dish);

    await expect(pierogiItem).toContainText(pierogi.restaurant);
    await expect(pierogiItem).toContainText(formatTripCardDate(day2));
    await expect(pierogiItem).toContainText(RatingStars.Five);
    await expect(pierogiItem).toContainText(formatMoney(pierogiCost));
    await expect(mealsSection.total).toHaveText(formatMoney(pierogiCost));
  });

  // when: Użytkownik otwiera edycję posiłku.
  await mealsSection.clickEditItemButton(pierogi.dish);

  // then: Formularz edycji ma wczytane dane posiłku.
  await test.step("Zweryfikuj formularz edycji posiłku", async () => {
    await expect(mealsSection.formTitle).toHaveText(expectedEditFormTitle);
    await expect(mealsSection.dishInput).toHaveValue(pierogi.dish);
    await expect(mealsSection.restaurantInput).toHaveValue(pierogi.restaurant);
    await expect(mealsSection.dateInput).toHaveValue(pierogi.date);
    await expect(mealsSection.costInput).toHaveValue(expectedCostInEditForm);
    await expect(mealsSection.ratingSelect).toHaveValue(pierogi.rating ?? "");
  });

  // when: Użytkownik zmienia wszystkie pola posiłku.
  await mealsSection.fillForm(editedPierogi);
  await mealsSection.clickSaveButton();

  // then: Na liście jest zmieniony posiłek zamiast starego.
  await test.step("Zweryfikuj zmieniony posiłek", async () => {
    const editedItem = mealsSection.getItemByTitle(editedPierogi.dish);

    await expect(editedItem).toContainText(editedPierogi.restaurant);
    await expect(editedItem).toContainText(formatTripCardDate(day3));
    await expect(editedItem).toContainText(RatingStars.Four);
    await expect(editedItem).toContainText(formatMoney(editedPierogiCost));
    await expect(mealsSection.total).toHaveText(formatMoney(editedPierogiCost));
    await expect(mealsSection.getItemByTitle(pierogi.dish)).toBeHidden();
  });

  // when: Użytkownik dodaje posiłek bez oceny i z kosztem 0.
  await mealsSection.addMeal(zupa);

  // then: Posiłek ma etykietę „bez oceny”, a suma się nie zmienia.
  await test.step("Zweryfikuj posiłek bez oceny i z kosztem 0", async () => {
    const zupaItem = mealsSection.getItemByTitle(zupa.dish);

    await expect(zupaItem).toContainText(expectedNoRating);
    await expect(zupaItem).toContainText(formatMoney(zupaCost));
    await expect(mealsSection.total).toHaveText(formatMoney(editedPierogiCost + zupaCost));
  });

  // when: Użytkownik anuluje usuwanie posiłku.
  const cancelledDeleteDialog = await mealsSection.clickDeleteItemButton(editedPierogi.dish);
  await cancelledDeleteDialog.clickCancelButton();

  // then: Posiłek zostaje na liście.
  await test.step("Zweryfikuj, że posiłek został po anulowaniu", async () => {
    await expect(cancelledDeleteDialog.dialog).toBeHidden();
    await expect(mealsSection.getItemByTitle(editedPierogi.dish)).toBeVisible();
  });

  // when: Użytkownik potwierdza usunięcie posiłku.
  const deleteDialog = await mealsSection.clickDeleteItemButton(editedPierogi.dish);
  await deleteDialog.clickConfirmButton();

  // then: Zostaje tylko drugi posiłek, a suma się aktualizuje.
  await test.step("Zweryfikuj usunięcie posiłku", async () => {
    await expect(mealsSection.items).toHaveCount(1);
    await expect(mealsSection.items).toContainText([zupa.dish]);
    await expect(mealsSection.total).toHaveText(formatMoney(zupaCost));
  });
});
