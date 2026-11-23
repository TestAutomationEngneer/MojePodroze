import { verifyTripOnList } from "@_src/assertions/trip-list.assertions";
import { TripStatusLabel } from "@_src/enums/trip.enum";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { domesticTripData } from "@_src/test-data/trip.data";

test("TC-13 Status podróży zmienia się tylko o jeden etap do przodu lub wstecz @logged", async ({
  myTripsPage,
  tripsApi,
}) => {
  // given: Użytkownik ma podróż „w planie”, utworzoną przez API.
  const trip = prepareTrip(domesticTripData);
  const expectedReadOnlyNotice = "Podróż jest w archiwum – można ją tylko przeglądać. Aby coś zmienić, cofnij status.";

  await tripsApi.createTrip(trip, "planned");

  // when: Użytkownik otwiera szczegóły podróży.
  await myTripsPage.goto();
  let tripPage = await myTripsPage.clickTripCard(trip.name);

  // then: Podróż „w planie” można tylko rozpocząć, edytować albo usunąć.
  await test.step("Zweryfikuj status W planie", async () => {
    await expect(tripPage.tripStatus).toHaveText(TripStatusLabel.Planned);
    await expect(tripPage.startTripButton).toBeEnabled();
    await expect(tripPage.editButton).toBeVisible();
    await expect(tripPage.deleteButton).toBeVisible();
    await expect(tripPage.revertStatusButton).toBeHidden();
  });

  // when: Użytkownik rozpoczyna podróż.
  await tripPage.clickStartTripButton();

  // then: Podróż jest „w trakcie” i można ją zakończyć albo cofnąć.
  await test.step("Zweryfikuj status W trakcie", async () => {
    await expect(tripPage.tripStatus).toHaveText(TripStatusLabel.InProgress);
    await expect(tripPage.revertStatusButton).toBeEnabled();
    await expect(tripPage.completeTripButton).toBeEnabled();
    await expect(tripPage.editButton).toBeVisible();
    await expect(tripPage.deleteButton).toBeVisible();
  });

  myTripsPage = await tripPage.clickBackLink();
  await verifyTripOnList(myTripsPage, trip.name, TripStatusLabel.InProgress);

  // when: Użytkownik cofa status.
  tripPage = await myTripsPage.clickTripCard(trip.name);
  await tripPage.clickRevertStatusButton();

  // then: Podróż wraca do statusu „w planie”.
  await test.step("Zweryfikuj powrót do statusu W planie", async () => {
    await expect(tripPage.tripStatus).toHaveText(TripStatusLabel.Planned);
    await expect(tripPage.startTripButton).toBeEnabled();
    await expect(tripPage.editButton).toBeVisible();
    await expect(tripPage.deleteButton).toBeVisible();
  });

  myTripsPage = await tripPage.clickBackLink();
  await verifyTripOnList(myTripsPage, trip.name, TripStatusLabel.Planned);

  // when: Użytkownik rozpoczyna i kończy podróż.
  tripPage = await myTripsPage.clickTripCard(trip.name);
  await tripPage.clickStartTripButton();
  await tripPage.clickCompleteTripButton();

  // then: Podróż jest „zrealizowana” i można ją zarchiwizować albo cofnąć.
  await test.step("Zweryfikuj status Zrealizowana", async () => {
    await expect(tripPage.tripStatus).toHaveText(TripStatusLabel.Completed);
    await expect(tripPage.revertStatusButton).toBeEnabled();
    await expect(tripPage.archiveButton).toBeEnabled();
    await expect(tripPage.editButton).toBeVisible();
    await expect(tripPage.deleteButton).toBeVisible();
  });

  myTripsPage = await tripPage.clickBackLink();
  await verifyTripOnList(myTripsPage, trip.name, TripStatusLabel.Completed);

  // when: Użytkownik cofa status zrealizowanej podróży.
  tripPage = await myTripsPage.clickTripCard(trip.name);
  await tripPage.clickRevertStatusButton();

  // then: Podróż wraca do statusu „w trakcie”.
  await test.step("Zweryfikuj powrót do statusu W trakcie", async () => {
    await expect(tripPage.tripStatus).toHaveText(TripStatusLabel.InProgress);
    await expect(tripPage.revertStatusButton).toBeEnabled();
    await expect(tripPage.completeTripButton).toBeEnabled();
  });

  myTripsPage = await tripPage.clickBackLink();
  await verifyTripOnList(myTripsPage, trip.name, TripStatusLabel.InProgress);

  // when: Użytkownik kończy podróż i przenosi ją do archiwum.
  tripPage = await myTripsPage.clickTripCard(trip.name);
  await tripPage.clickCompleteTripButton();
  await tripPage.clickArchiveButton();

  // then: Podróż w archiwum jest tylko do odczytu – zostaje tylko cofnięcie statusu.
  await test.step("Zweryfikuj status Archiwum", async () => {
    await expect(tripPage.tripStatus).toHaveText(TripStatusLabel.Archived);
    await expect(tripPage.revertStatusButton).toBeEnabled();
    await expect(tripPage.readOnlyNotice).toHaveText(expectedReadOnlyNotice);
    await expect(tripPage.editButton).toBeHidden();
    await expect(tripPage.deleteButton).toBeHidden();
  });

  myTripsPage = await tripPage.clickBackLink();
  await verifyTripOnList(myTripsPage, trip.name, TripStatusLabel.Archived);

  // when: Użytkownik cofa status podróży z archiwum.
  tripPage = await myTripsPage.clickTripCard(trip.name);
  await tripPage.clickRevertStatusButton();

  // then: Podróż jest znowu „zrealizowana” i można ją edytować.
  await test.step("Zweryfikuj powrót z archiwum do statusu Zrealizowana", async () => {
    await expect(tripPage.tripStatus).toHaveText(TripStatusLabel.Completed);
    await expect(tripPage.revertStatusButton).toBeEnabled();
    await expect(tripPage.archiveButton).toBeEnabled();
    await expect(tripPage.editButton).toBeVisible();
    await expect(tripPage.deleteButton).toBeVisible();
    await expect(tripPage.readOnlyNotice).toBeHidden();
  });

  myTripsPage = await tripPage.clickBackLink();
  await verifyTripOnList(myTripsPage, trip.name, TripStatusLabel.Completed);
});
