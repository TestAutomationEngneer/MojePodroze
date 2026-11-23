import { verifyTripListLoaded } from "@_src/assertions/trip-list.assertions";
import { StatusTabLabel, TRIP_STATUS_LABELS } from "@_src/enums/trip.enum";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { TripStatus } from "@_src/models/trip.model";
import { domesticTripData, foreignTripData } from "@_src/test-data/trip.data";
import { getExpectedStatusTabText } from "@_src/utils/trip.util";

// Ten sam przypadek testowy dla obu typów podróży – różnią się tylko danymi.
const variants = [
  {
    id: "TC-10-5",
    title: "Użytkownik usuwa podróże krajowe o wszystkich statusach, oprócz archiwum",
    tripData: domesticTripData,
  },
  {
    id: "TC-10-6",
    title: "Użytkownik usuwa podróże zagraniczne o wszystkich statusach, oprócz archiwum",
    tripData: foreignTripData,
  },
];

for (const { id, title, tripData } of variants) {
  test(`${id} ${title} @logged`, async ({ myTripsPage, tripsApi, page }) => {
    const statusesToDelete: TripStatus[] = ["planned", "in_progress", "completed"];
    const expectedDialogTitle = "Usunąć podróż?";
    const expectedNotFoundMessage = "Nie znaleziono podróży.";

    for (const status of statusesToDelete) {
      // given: Użytkownik ma podróż o danym statusie, utworzoną przez API, i zna licznik „Wszystkie”.
      const trip = prepareTrip(tripData);
      const tripId = await tripsApi.createTrip(trip, status);
      const statusLabel = TRIP_STATUS_LABELS[status];
      const expectedDialogMessage = `„${trip.name}” zostanie usunięta razem ze wszystkimi wpisami i zdjęciami. Tego nie da się cofnąć.`;

      await myTripsPage.goto();
      const initialTabs = await test.step(`Zweryfikuj załadowanie listy i odczytaj liczniki – ${statusLabel}`, async () => {
        await verifyTripListLoaded(myTripsPage);

        return myTripsPage.statusTabs.getTabs();
      });

      // when: Użytkownik klika „Usuń podróż” w szczegółach.
      const tripPage = await myTripsPage.clickTripCard(trip.name);
      const deleteTripDialog = await tripPage.clickDeleteButton();

      // then: Okno potwierdzenia ostrzega, że usunięcia nie da się cofnąć.
      await test.step(`Zweryfikuj okno potwierdzenia – ${statusLabel}`, async () => {
        await expect(deleteTripDialog.dialog).toBeVisible();
        await expect(deleteTripDialog.title).toHaveText(expectedDialogTitle);
        await expect(deleteTripDialog.message).toHaveText(expectedDialogMessage);
      });

      // when: Użytkownik potwierdza usunięcie.
      myTripsPage = await deleteTripDialog.confirmDelete();

      // then: Podróży nie ma na liście, licznik „Wszystkie” maleje o 1, a jej adres pokazuje błąd.
      await test.step(`Zweryfikuj usunięcie podróży – ${statusLabel}`, async () => {
        await expect(page).toHaveURL(myTripsPage.url);
        await verifyTripListLoaded(myTripsPage);
        await expect(myTripsPage.statusTabs.allTab).toHaveText(
          getExpectedStatusTabText(StatusTabLabel.All, initialTabs.all.count - 1),
        );
        await expect(myTripsPage.getCardByName(trip.name)).toHaveCount(0);
      });

      await tripPage.gotoTrip(tripId);

      await test.step(`Zweryfikuj, że usuniętej podróży nie da się otworzyć – ${statusLabel}`, async () => {
        await expect(tripPage.loadErrorText).toContainText(expectedNotFoundMessage);
      });
    }
  });
}
