import { verifyTripDetails } from "@_src/assertions/trip.assertions";
import { verifyTripListLoaded } from "@_src/assertions/trip-list.assertions";
import { StatusTabLabel, TripCharacterId, TripStatusLabel, TripType } from "@_src/enums/trip.enum";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { tripCharacterOptions, tripTypeOptions } from "@_src/test-data/trip-form.data";
import { domesticTripData, foreignTripData } from "@_src/test-data/trip.data";
import { getExpectedStatusTabText, getExpectedTripMetaText } from "@_src/utils/trip.util";

// Ten sam przypadek testowy dla obu typów podróży – różnią się tylko danymi.
const variants = [
  { id: "TC-10-1", title: "Użytkownik dodaje podróż krajową przez formularz", tripData: domesticTripData },
  { id: "TC-10-2", title: "Użytkownik dodaje podróż zagraniczną przez formularz", tripData: foreignTripData },
];

for (const { id, title, tripData } of variants) {
  test(`${id} ${title} @logged`, async ({ myTripsPage, tripsApi, page }) => {
    // given: Użytkownik jest na liście podróży i zna liczniki zakładek.
    const trip = prepareTrip(tripData);
    tripsApi.addTripToCleanup(trip.name);
    const expectedFormHeading = "Nowa podróż";
    const { statusTabs } = myTripsPage;

    await myTripsPage.goto();

    const initialTabs = await test.step("Zweryfikuj załadowanie listy i odczytaj liczniki", async () => {
      await verifyTripListLoaded(myTripsPage);

      return statusTabs.getTabs();
    });

    // when: Użytkownik otwiera formularz nowej podróży.
    const tripFormPage = await myTripsPage.clickNewTripButton();

    // then: Formularz ma domyślny typ „Zagraniczna”, charakter „Miasto” i pełne listy wyboru.
    await test.step("Zweryfikuj formularz nowej podróży", async () => {
      await expect(page).toHaveURL(tripFormPage.url);
      await expect(tripFormPage.heading).toHaveText(expectedFormHeading);
      await expect(tripFormPage.typeSelect, "Domyślny typ nowej podróży to „Zagraniczna”").toHaveValue(TripType.Foreign);
      await expect(tripFormPage.characterSelect, "Domyślny charakter nowej podróży to „Miasto”").toHaveValue(
        String(TripCharacterId.City),
      );
      await expect(tripFormPage.typeOptions).toHaveText(tripTypeOptions);
      await expect(tripFormPage.characterOptions).toHaveText(tripCharacterOptions);
    });

    // when: Użytkownik wypełnia i zapisuje formularz.
    myTripsPage = await tripFormPage.createTrip(trip);

    // then: Podróż jest na liście „w planie”, a liczniki „Wszystkie” i „W planie” rosną o 1.
    await test.step("Zweryfikuj powrót na listę i liczniki", async () => {
      await expect(page).toHaveURL(myTripsPage.url);
      await verifyTripListLoaded(myTripsPage);
      await expect(statusTabs.allTab).toHaveText(getExpectedStatusTabText(StatusTabLabel.All, initialTabs.all.count + 1));
      await expect(statusTabs.plannedTab).toHaveText(
        getExpectedStatusTabText(StatusTabLabel.Planned, initialTabs.planned.count + 1),
      );
      await expect(statusTabs.inProgressTab).toHaveText(
        getExpectedStatusTabText(StatusTabLabel.InProgress, initialTabs.inProgress.count),
      );
      await expect(statusTabs.completedTab).toHaveText(
        getExpectedStatusTabText(StatusTabLabel.Completed, initialTabs.completed.count),
      );
      await expect(statusTabs.archivedTab).toHaveText(
        getExpectedStatusTabText(StatusTabLabel.Archived, initialTabs.archived.count),
      );
    });

    await test.step("Zweryfikuj kartę podróży", async () => {
      await expect(myTripsPage.getCardStatus(trip.name)).toHaveText(TripStatusLabel.Planned);
      await expect(myTripsPage.getCardMeta(trip.name)).toHaveText(getExpectedTripMetaText(trip));
    });

    // when: Użytkownik otwiera kartę nowej podróży.
    const tripPage = await myTripsPage.clickTripCard(trip.name);

    // then: Szczegóły pokazują wpisane dane i przyciski edycji, usuwania i rozpoczęcia podróży.
    await test.step("Zweryfikuj szczegóły podróży", async () => {
      await verifyTripDetails(tripPage, trip, TripStatusLabel.Planned);
      await expect(tripPage.editButton).toBeVisible();
      await expect(tripPage.deleteButton).toBeVisible();
      await expect(tripPage.startTripButton).toBeVisible();
    });
  });
}
