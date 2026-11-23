import { RecommendationsComponent } from "@_src/components/recommendations.component";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { AddTripModel } from "@_src/models/trip.model";
import { formatTripCardDate } from "@_src/utils/date.util";

export async function verifyRecommendations(
  recommendations: RecommendationsComponent,
  expectedCity: string,
  expectedPreviousTrips: AddTripModel[],
  expectedRestaurants: string[],
  expectedPlaces: string[],
): Promise<void> {
  await test.step("Zweryfikuj wcześniejsze podróże do miasta", async () => {
    await expect(recommendations.previousTripsText).toContainText(`Wcześniejsze podróże do miasta ${expectedCity}:`);

    for (const trip of expectedPreviousTrips) {
      await expect(recommendations.previousTripsText).toContainText(trip.name);
      await expect(recommendations.previousTripsText).toContainText(
        `${formatTripCardDate(trip.start_date)} – ${formatTripCardDate(trip.end_date)}`,
      );
    }
  });

  await test.step("Zweryfikuj polecane restauracje", async () => {
    await expect(recommendations.restaurants).toHaveText(expectedRestaurants);
  });

  await test.step("Zweryfikuj polecane noclegi i atrakcje", async () => {
    await expect(recommendations.places).toHaveText(expectedPlaces);
  });
}
