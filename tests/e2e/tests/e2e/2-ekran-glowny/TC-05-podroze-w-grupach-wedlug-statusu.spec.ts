import {
  verifyOnlyTripsWithStatusInTab,
  verifyStatusTabsVisible,
  verifyTripListLoaded,
} from "@_src/assertions/trip-list.assertions";
import { StatusTabLabel, TripStatusLabel } from "@_src/enums/trip.enum";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { TripCardModel } from "@_src/models/trip-card.model";
import { completedTripData, inProgressTripData, plannedTripData } from "@_src/test-data/trip.data";
import { getExpectedCardsOrder, getExpectedCountdownForNearestTrip } from "@_src/utils/trip-card.util";
import { getExpectedStatusTabText } from "@_src/utils/trip.util";

test("TC-05 Podróże wyświetlane są na liście podróży w grupach według statusu @logged", async ({
  myTripsPage,
  tripsApi,
  page,
}) => {
  // given: Użytkownik ma podróże w planie, w trakcie i zrealizowaną, utworzone przez API.
  const plannedTrip = prepareTrip(plannedTripData);
  const inProgressTrip = prepareTrip(inProgressTripData);
  const completedTrip = prepareTrip(completedTripData);
  const expectedPageTitle = "Moje podróże";
  const { statusTabs, nextTripCountdown } = myTripsPage;

  const plannedTripId = await tripsApi.createTrip(plannedTrip, "planned");
  await tripsApi.createTrip(inProgressTrip, "in_progress");
  await tripsApi.createTrip(completedTrip, "completed");

  // when: Użytkownik otwiera listę „Moje podróże”.
  await myTripsPage.goto();

  // then: Zakładki mają liczniki, karty są pogrupowane według statusu, a odliczanie wskazuje najbliższą podróż.
  await test.step("Zweryfikuj załadowanie strony", async () => {
    await expect(page).toHaveTitle(expectedPageTitle);
    await verifyTripListLoaded(myTripsPage);
  });

  const initialTabs = await test.step("Zweryfikuj zakładki i liczniki", async () => {
    await verifyStatusTabsVisible(myTripsPage);

    const tabs = await statusTabs.getTabs();
    const sumOfOtherTabs = tabs.planned.count + tabs.inProgress.count + tabs.completed.count + tabs.archived.count;
    const expectedActiveTabText = getExpectedStatusTabText(StatusTabLabel.All, sumOfOtherTabs);

    await expect(
      statusTabs.activeTab,
      `Aktywna zakładka to „Wszystkie”, a jej licznik jest sumą pozostałych: „${expectedActiveTabText}”`,
    ).toHaveText(expectedActiveTabText);

    return tabs;
  });

  let allCards: TripCardModel[] = [];

  await test.step("Zweryfikuj sortowanie kart i dodane podróże", async () => {
    await expect(async () => {
      allCards = await myTripsPage.getAllTripCards();
      expect(allCards, "Karty są posortowane według statusu i daty od").toEqual(getExpectedCardsOrder(allCards));
    }).toPass();

    await expect(myTripsPage.getCardByName(plannedTrip.name)).toBeVisible();
    await expect(myTripsPage.getCardByName(inProgressTrip.name)).toBeVisible();
    await expect(myTripsPage.getCardByName(completedTrip.name)).toBeVisible();
  });

  await test.step("Zweryfikuj zawartość kart", async () => {
    const cardsCount = allCards.length;

    await expect(myTripsPage.tripCardStatuses).toHaveCount(cardsCount);
    await expect(myTripsPage.tripCardNames).toHaveCount(cardsCount);
    await expect(myTripsPage.tripCardDetails).toHaveCount(cardsCount);
  });

  await test.step("Zweryfikuj widget najbliższej podróży", async () => {
    const expectedCountdown = getExpectedCountdownForNearestTrip(allCards);

    await expect(nextTripCountdown, `Odliczanie zawiera „${expectedCountdown}”`).toContainText(expectedCountdown);
  });

  // when: Użytkownik przełącza kolejno zakładki statusów.
  await statusTabs.clickPlannedTab();

  // then: Każda zakładka pokazuje tylko podróże o swoim statusie, w liczbie zgodnej z licznikiem.
  await test.step("Zweryfikuj zakładkę W planie", async () => {
    await verifyOnlyTripsWithStatusInTab(myTripsPage, TripStatusLabel.Planned, initialTabs.planned.count, plannedTrip.name);
  });

  await statusTabs.clickInProgressTab();

  await test.step("Zweryfikuj zakładkę W trakcie", async () => {
    await verifyOnlyTripsWithStatusInTab(
      myTripsPage,
      TripStatusLabel.InProgress,
      initialTabs.inProgress.count,
      inProgressTrip.name,
    );
  });

  await statusTabs.clickCompletedTab();

  await test.step("Zweryfikuj zakładkę Zrealizowane", async () => {
    await verifyOnlyTripsWithStatusInTab(
      myTripsPage,
      TripStatusLabel.Completed,
      initialTabs.completed.count,
      completedTrip.name,
    );
  });

  // when: Użytkownik przenosi zrealizowaną podróż do archiwum i wraca na listę.
  const completedTripPage = await myTripsPage.clickTripCard(completedTrip.name);
  await completedTripPage.clickArchiveButton();

  await test.step("Zweryfikuj przeniesienie do archiwum", async () => {
    await expect(completedTripPage.readOnlyNotice).toBeVisible();
  });

  myTripsPage = await completedTripPage.clickBackLink();

  // then: Licznik „Zrealizowane” maleje o 1, „Archiwum” rośnie o 1, a pozostałe się nie zmieniają.
  await test.step("Zweryfikuj liczniki po przeniesieniu do archiwum", async () => {
    await verifyTripListLoaded(myTripsPage);
    await expect(statusTabs.allTab).toHaveText(getExpectedStatusTabText(StatusTabLabel.All, initialTabs.all.count));
    await expect(statusTabs.plannedTab).toHaveText(
      getExpectedStatusTabText(StatusTabLabel.Planned, initialTabs.planned.count),
    );
    await expect(statusTabs.inProgressTab).toHaveText(
      getExpectedStatusTabText(StatusTabLabel.InProgress, initialTabs.inProgress.count),
    );
    await expect(statusTabs.completedTab).toHaveText(
      getExpectedStatusTabText(StatusTabLabel.Completed, initialTabs.completed.count - 1),
    );
    await expect(statusTabs.archivedTab).toHaveText(
      getExpectedStatusTabText(StatusTabLabel.Archived, initialTabs.archived.count + 1),
    );
  });

  // when: Użytkownik otwiera zakładkę „Archiwum”.
  await statusTabs.clickArchivedTab();

  // then: Przeniesiona podróż jest w archiwum.
  await test.step("Zweryfikuj zakładkę Archiwum", async () => {
    await expect(myTripsPage.getCardStatus(completedTrip.name)).toHaveText(TripStatusLabel.Archived);
  });

  // when: Użytkownik otwiera kartę podróży w planie.
  await statusTabs.clickPlannedTab();
  const plannedTripPage = await myTripsPage.clickTripCard(plannedTrip.name);

  // then: Otwierają się szczegóły tej podróży.
  await test.step("Zweryfikuj szczegóły podróży", async () => {
    await expect(page).toHaveURL(plannedTripPage.getUrl(plannedTripId));
    await expect(plannedTripPage.tripTitle).toHaveText(plannedTrip.name);
    await expect(plannedTripPage.tripStatus).toHaveText(TripStatusLabel.Planned);
  });
});
