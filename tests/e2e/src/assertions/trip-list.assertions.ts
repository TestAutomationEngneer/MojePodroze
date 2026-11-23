import { TripStatusLabel } from "@_src/enums/trip.enum";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { MyTripsPage } from "@_src/pages/my-trips.page";

export async function verifyTripListLoaded(myTripsPage: MyTripsPage): Promise<void> {
  await expect(myTripsPage.newTripButton).toBeVisible();
  await expect(myTripsPage.loadingText).toBeHidden();
}

export async function verifyStatusTabsVisible(myTripsPage: MyTripsPage): Promise<void> {
  const { statusTabs } = myTripsPage;

  await expect(statusTabs.allTab).toBeVisible();
  await expect(statusTabs.plannedTab).toBeVisible();
  await expect(statusTabs.inProgressTab).toBeVisible();
  await expect(statusTabs.completedTab).toBeVisible();
  await expect(statusTabs.archivedTab).toBeVisible();
}

export async function verifyOnlyTripsWithStatusInTab(
  myTripsPage: MyTripsPage,
  expectedStatus: TripStatusLabel,
  expectedCount: number,
  expectedTripName: string,
): Promise<void> {
  const expectedStatuses = Array<string>(expectedCount).fill(expectedStatus);

  await expect(myTripsPage.tripCards, "Liczba kart jest zgodna z licznikiem zakładki").toHaveCount(expectedCount);
  await expect(myTripsPage.tripCardStatuses).toHaveText(expectedStatuses);
  await expect(myTripsPage.getCardByName(expectedTripName)).toBeVisible();
}

export async function verifyTripOnList(
  myTripsPage: MyTripsPage,
  tripName: string,
  expectedStatus: TripStatusLabel,
): Promise<void> {
  await test.step(`Zweryfikuj podróż na liście ze statusem „${expectedStatus}”`, async () => {
    await verifyTripListLoaded(myTripsPage);
    await expect(myTripsPage.getCardStatus(tripName)).toHaveText(expectedStatus);

    await myTripsPage.statusTabs.clickTabForStatus(expectedStatus);
    await expect(myTripsPage.statusTabs.getTabForStatus(expectedStatus)).toHaveAttribute("aria-selected", "true");
    await expect(myTripsPage.getCardByName(tripName)).toBeVisible();
  });
}
