import { TripStatusLabel } from "@_src/enums/trip.enum";
import { expect } from "@_src/fixtures/merge.fixture";
import { AddTripModel } from "@_src/models/trip.model";
import { TripFormPage } from "@_src/pages/trip-form.page";
import { TripPage } from "@_src/pages/trip.page";
import { formatFormBudget } from "@_src/utils/money.util";
import { getExpectedOverviewValues, getExpectedTripMetaText } from "@_src/utils/trip.util";

export async function verifyTripDetails(
  tripPage: TripPage,
  trip: AddTripModel,
  expectedStatus: TripStatusLabel,
): Promise<void> {
  await expect(tripPage.tripTitle).toHaveText(trip.name);
  await expect(tripPage.tripStatus).toHaveText(expectedStatus);
  await expect(tripPage.tripMeta).toHaveText(getExpectedTripMetaText(trip));
  await expect(tripPage.overviewValues).toHaveText(getExpectedOverviewValues(trip));
}

export async function verifyTripFormValues(tripFormPage: TripFormPage, trip: AddTripModel): Promise<void> {
  await expect(tripFormPage.nameInput).toHaveValue(trip.name);
  await expect(tripFormPage.cityInput).toHaveValue(trip.destination_city);
  await expect(tripFormPage.countryInput).toHaveValue(trip.destination_country);
  await expect(tripFormPage.budgetInput).toHaveValue(formatFormBudget(trip.planned_budget));
  await expect(tripFormPage.startDateInput).toHaveValue(trip.start_date);
  await expect(tripFormPage.endDateInput).toHaveValue(trip.end_date);
  await expect(tripFormPage.typeSelect).toHaveValue(trip.trip_type);
  await expect(tripFormPage.characterSelect).toHaveValue(String(trip.character_id));
}
