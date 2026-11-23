import { verifyTripDetails, verifyTripFormValues } from "@_src/assertions/trip.assertions";
import { TripStatusLabel } from "@_src/enums/trip.enum";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { domesticTripData, foreignTripData } from "@_src/test-data/trip.data";

// Ten sam przypadek testowy dla obu typów podróży: edycja zmienia każde pole, także typ podróży.
const variants = [
  {
    id: "TC-10-3",
    title: "Użytkownik edytuje wszystkie pola podróży zagranicznej",
    createdTripData: foreignTripData,
    editedTripData: domesticTripData,
  },
  {
    id: "TC-10-4",
    title: "Użytkownik edytuje wszystkie pola podróży krajowej",
    createdTripData: domesticTripData,
    editedTripData: foreignTripData,
  },
];

for (const { id, title, createdTripData, editedTripData } of variants) {
  test(`${id} ${title} @logged`, async ({ myTripsPage, tripsApi, page }) => {
    // given: Użytkownik ma podróż „w planie” utworzoną przez API.
    const createdTrip = prepareTrip(createdTripData);
    const editedTrip = prepareTrip(editedTripData);
    tripsApi.addTripToCleanup(editedTrip.name);
    const expectedEditFormHeading = "Edytuj podróż";
    const expectedCancelButtonText = "Anuluj";
    const expectedSaveButtonText = "Zapisz zmiany";

    const tripId = await tripsApi.createTrip(createdTrip, "planned");
    await myTripsPage.goto();
    const tripPage = await myTripsPage.clickTripCard(createdTrip.name);

    // when: Użytkownik otwiera formularz edycji podróży.
    const editTripFormPage = await tripPage.clickEditButton();

    // then: Formularz edycji ma wczytane wszystkie dane podróży.
    await test.step("Zweryfikuj formularz edycji", async () => {
      await expect(page).toHaveURL(tripPage.getEditUrl(tripId));
      await expect(editTripFormPage.heading).toHaveText(expectedEditFormHeading);
      await expect(editTripFormPage.cancelButton).toBeEnabled();
      await expect(editTripFormPage.cancelButton).toHaveText(expectedCancelButtonText);
      await expect(editTripFormPage.saveButton).toBeEnabled();
      await expect(editTripFormPage.saveButton).toHaveText(expectedSaveButtonText);
      await verifyTripFormValues(editTripFormPage, createdTrip);
    });

    // when: Użytkownik zmienia wszystkie pola i zapisuje formularz.
    const editedTripPage = await editTripFormPage.updateTrip(editedTrip);

    // then: Szczegóły podróży pokazują nowe dane.
    await test.step("Zweryfikuj zmienione dane podróży", async () => {
      await verifyTripDetails(editedTripPage, editedTrip, TripStatusLabel.Planned);
    });
  });
}
