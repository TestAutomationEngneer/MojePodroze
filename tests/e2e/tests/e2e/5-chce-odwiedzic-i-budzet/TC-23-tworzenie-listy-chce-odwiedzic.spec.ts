import { TripSectionTab } from "@_src/enums/trip.enum";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { ChecklistItemFormModel } from "@_src/models/checklist-item-form.model";
import { domesticTripData } from "@_src/test-data/trip.data";
import { getExpectedWishlistProgress } from "@_src/utils/checklist.util";

test("TC-23 Użytkownik tworzy listę „Chcę odwiedzić” i odhacza zaliczone miejsca @logged", async ({
  myTripsPage,
  tripsApi,
}) => {
  // given: Użytkownik ma podróż krajową z pustą listą „Chcę odwiedzić”, utworzoną przez API.
  const trip = prepareTrip(domesticTripData);
  const basilica: ChecklistItemFormModel = { name: "Bazylika Mariacka", note: "Wejść na wieżę" };
  const fountain: ChecklistItemFormModel = { name: "Fontanna Neptuna" };
  const crane: ChecklistItemFormModel = { name: "Żuraw" };
  const fountainNewName = "Fontanna Neptuna na Długim Targu";
  const placesCount = [basilica, fountain, crane].length;
  const placesCountAfterDelete = placesCount - 1;

  const expectedNameLabel = "Miejsce";
  const expectedNoteLabel = "Notatka (opcjonalnie)";
  const expectedEmptyText = "Lista jest pusta. Dopisz miejsca, które chcesz zobaczyć – odhaczysz je na miejscu.";
  const expectedNameError = "Podaj nazwę.";
  const expectedDeleteDialogTitle = "Usunąć miejsce?";
  const expectedDeleteDialogMessage = `„${crane.name}” zniknie z listy.`;

  await tripsApi.createTrip(trip, "planned");
  await myTripsPage.goto();
  const tripPage = await myTripsPage.clickTripCard(trip.name);
  const { wishlistSection } = tripPage;

  // when: Użytkownik otwiera zakładkę „Chcę odwiedzić”.
  await tripPage.sectionTabs.clickTab(TripSectionTab.Wishlist);

  // then: Lista jest pusta, a formularz ma pola miejsca i notatki.
  await test.step("Zweryfikuj pustą listę", async () => {
    await expect(wishlistSection.nameInput).toHaveAccessibleName(expectedNameLabel);
    await expect(wishlistSection.noteInput).toHaveAccessibleName(expectedNoteLabel);
    await expect(wishlistSection.addButton).toBeVisible();
    await expect(wishlistSection.emptyText).toHaveText(expectedEmptyText);
  });

  // when: Użytkownik klika „Dodaj” bez nazwy.
  await wishlistSection.clickAddButton();

  // then: Lista prosi o nazwę i nic nie dodaje.
  await test.step("Zweryfikuj błąd pustej nazwy", async () => {
    await expect(wishlistSection.addError).toHaveText(expectedNameError);
    await expect(wishlistSection.items).toHaveCount(0);
  });

  // when: Użytkownik dodaje trzy miejsca, jedno z notatką.
  await wishlistSection.addItem(basilica);

  await test.step("Zweryfikuj miejsce z notatką", async () => {
    await expect(wishlistSection.getItemByName(basilica.name)).toContainText(basilica.note ?? "");
    await expect(wishlistSection.nameInput).toHaveValue("");
    await expect(wishlistSection.noteInput).toHaveValue("");
  });

  await wishlistSection.addItem(fountain);

  await test.step(`Zweryfikuj dodanie „${fountain.name}”`, async () => {
    await expect(wishlistSection.getItemByName(fountain.name)).toBeVisible();
  });

  await wishlistSection.addItem(crane);

  // then: Na liście są trzy niezaliczone miejsca.
  await test.step("Zweryfikuj trzy miejsca na liście", async () => {
    await expect(wishlistSection.getItemByName(crane.name)).toBeVisible();
    await expect(wishlistSection.items).toHaveCount(placesCount);
    await expect(wishlistSection.checkboxes).toHaveCount(placesCount);
    await expect(wishlistSection.progress).toHaveText(getExpectedWishlistProgress(0, placesCount));
  });

  // when: Użytkownik odhacza miejsce.
  await wishlistSection.clickCheckbox(basilica.name);

  // then: Miejsce jest zaliczone, a postęp rośnie.
  await test.step("Zweryfikuj odhaczone miejsce", async () => {
    await expect(wishlistSection.getCheckbox(basilica.name)).toBeChecked();
    await expect(wishlistSection.progress).toHaveText(getExpectedWishlistProgress(1, placesCount));
  });

  // when: Użytkownik odświeża stronę.
  await tripPage.reload();
  await tripPage.sectionTabs.clickTab(TripSectionTab.Wishlist);

  // then: Zaliczenie jest zapisane.
  await test.step("Zweryfikuj zapisany stan po odświeżeniu", async () => {
    await expect(wishlistSection.getCheckbox(basilica.name)).toBeChecked();
    await expect(wishlistSection.progress).toHaveText(getExpectedWishlistProgress(1, placesCount));
  });

  // when: Użytkownik odznacza miejsce.
  await wishlistSection.clickCheckbox(basilica.name);

  // then: Miejsce znowu jest niezaliczone.
  await test.step("Zweryfikuj odznaczenie miejsca", async () => {
    await expect(wishlistSection.progress).toHaveText(getExpectedWishlistProgress(0, placesCount));
    await expect(wishlistSection.getCheckbox(basilica.name)).not.toBeChecked();
  });

  // when: Użytkownik zmienia nazwę miejsca.
  await wishlistSection.editItemName(fountain.name, fountainNewName);

  // then: Miejsce ma nową nazwę.
  await test.step("Zweryfikuj zmienioną nazwę", async () => {
    await expect(wishlistSection.getItemByName(fountainNewName)).toBeVisible();
  });

  // when: Użytkownik usuwa miejsce.
  const deleteDialog = await wishlistSection.clickDeleteItemButton(crane.name);

  await test.step("Zweryfikuj okno usuwania pozycji", async () => {
    await expect(deleteDialog.title).toHaveText(expectedDeleteDialogTitle);
    await expect(deleteDialog.message).toHaveText(expectedDeleteDialogMessage);
  });

  await deleteDialog.clickConfirmButton();

  // then: Miejsca nie ma na liście, a postęp liczy już tylko dwa miejsca.
  await test.step("Zweryfikuj usunięcie miejsca", async () => {
    await expect(wishlistSection.progress).toHaveText(getExpectedWishlistProgress(0, placesCountAfterDelete));
    await expect(wishlistSection.getItemByName(crane.name)).toBeHidden();
  });

  // when: Użytkownik odhacza wszystkie pozostałe miejsca.
  await wishlistSection.clickCheckbox(basilica.name);
  await wishlistSection.clickCheckbox(fountainNewName);

  // then: Wszystkie miejsca są zaliczone.
  await test.step("Zweryfikuj odhaczenie wszystkich miejsc", async () => {
    await expect(wishlistSection.progress).toHaveText(
      getExpectedWishlistProgress(placesCountAfterDelete, placesCountAfterDelete),
    );
  });
});
