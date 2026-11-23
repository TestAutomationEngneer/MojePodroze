import { BudgetLevel } from "@_src/enums/budget.enum";
import { TripSectionTab } from "@_src/enums/trip.enum";
import { prepareMeal } from "@_src/factories/meal.factory";
import { prepareTrip } from "@_src/factories/trip.factory";
import { expect, test } from "@_src/fixtures/merge.fixture";
import { ExpenseFormModel } from "@_src/models/expense-form.model";
import { domesticTripData } from "@_src/test-data/trip.data";
import {
  formatBudgetPercent,
  getExpectedBudgetExceededStatus,
  getExpectedBudgetWarningStatus,
  getExpectedSpentText,
  getExpectedWithinBudgetStatus,
} from "@_src/utils/budget.util";
import { formatAmount, formatMoney } from "@_src/utils/money.util";

test("TC-30 Status budżetu zmienia się w progach 90% i 100% @logged", async ({ myTripsPage, tripsApi }) => {
  // given: Użytkownik ma podróż z budżetem 1000 zł i posiłkiem za 799 zł, utworzoną przez API.
  const budget = 1000;
  const mealCost = 799;
  const ticketCostBelowWarning = 100;
  const ticketCostAtWarning = 101;
  const ticketCostAtFullBudget = 201;
  const ticketCostOverBudget = 201.01;

  const trip = prepareTrip({ ...domesticTripData, planned_budget: budget });
  const meal = { ...prepareMeal(trip), cost: mealCost };
  const ticket: ExpenseFormModel = {
    description: "Bilet",
    category: "Bilety wstępu",
    cost: formatAmount(ticketCostBelowWarning),
  };

  const spentBelowWarning = mealCost + ticketCostBelowWarning;
  const spentAtWarning = mealCost + ticketCostAtWarning;
  const spentAtFullBudget = mealCost + ticketCostAtFullBudget;
  const spentOverBudget = mealCost + ticketCostOverBudget;

  const tripId = await tripsApi.createTrip(trip, "planned");
  await tripsApi.createMeal(tripId, meal);
  await myTripsPage.goto();
  const tripPage = await myTripsPage.clickTripCard(trip.name);
  const { sectionTabs, costSummary, expensesSection } = tripPage;

  // when: Użytkownik dodaje wydatek, po którym wydano 89,9% budżetu.
  await sectionTabs.clickTab(TripSectionTab.Expenses);
  await expensesSection.addExpense(ticket);

  await test.step(`Zweryfikuj kwotę wydatku „${ticket.description}”`, async () => {
    await expect(expensesSection.getItemByTitle(ticket.description)).toContainText(formatMoney(ticketCostBelowWarning));
  });

  await sectionTabs.clickTab(TripSectionTab.Costs);

  // then: Budżet ma status „ok”.
  await test.step("Zweryfikuj budżet poniżej 90%", async () => {
    await expect(costSummary.budget).toContainText(
      `${getExpectedSpentText(spentBelowWarning, budget)} (${formatBudgetPercent(spentBelowWarning, budget)}%)`,
    );
    await expect(costSummary.budgetStatus).toHaveText(getExpectedWithinBudgetStatus(spentBelowWarning, budget));
    await expect(costSummary.budget).toHaveAttribute("data-level", BudgetLevel.Ok);
  });

  // when: Użytkownik zmienia wydatek tak, że wydano dokładnie 90% budżetu.
  await sectionTabs.clickTab(TripSectionTab.Expenses);
  await expensesSection.editExpense(ticket.description, { ...ticket, cost: formatAmount(ticketCostAtWarning) });

  await test.step(`Zweryfikuj kwotę wydatku „${ticket.description}”`, async () => {
    await expect(expensesSection.getItemByTitle(ticket.description)).toContainText(formatMoney(ticketCostAtWarning));
  });

  await sectionTabs.clickTab(TripSectionTab.Costs);

  // then: Budżet ma status ostrzeżenia.
  await test.step("Zweryfikuj ostrzeżenie przy 90%", async () => {
    await expect(costSummary.budget).toContainText(
      `${getExpectedSpentText(spentAtWarning, budget)} (${formatBudgetPercent(spentAtWarning, budget)}%)`,
    );
    await expect(costSummary.budgetStatus).toHaveText(getExpectedBudgetWarningStatus(spentAtWarning, budget));
    await expect(costSummary.budget).toHaveAttribute("data-level", BudgetLevel.Warning);
  });

  // when: Użytkownik zmienia wydatek tak, że wydano dokładnie 100% budżetu.
  await sectionTabs.clickTab(TripSectionTab.Expenses);
  await expensesSection.editExpense(ticket.description, { ...ticket, cost: formatAmount(ticketCostAtFullBudget) });

  await test.step(`Zweryfikuj kwotę wydatku „${ticket.description}”`, async () => {
    await expect(expensesSection.getItemByTitle(ticket.description)).toContainText(formatMoney(ticketCostAtFullBudget));
  });

  await sectionTabs.clickTab(TripSectionTab.Costs);

  // then: Budżet nadal ma status ostrzeżenia, nie przekroczenia.
  await test.step("Zweryfikuj ostrzeżenie przy 100%", async () => {
    await expect(costSummary.budgetStatus).toHaveText(getExpectedBudgetWarningStatus(spentAtFullBudget, budget));
    await expect(costSummary.budget).toHaveAttribute("data-level", BudgetLevel.Warning);
  });

  // when: Użytkownik zmienia wydatek tak, że budżet jest przekroczony o 1 grosz.
  await sectionTabs.clickTab(TripSectionTab.Expenses);
  await expensesSection.editExpense(ticket.description, { ...ticket, cost: formatAmount(ticketCostOverBudget) });

  await test.step(`Zweryfikuj kwotę wydatku „${ticket.description}”`, async () => {
    await expect(expensesSection.getItemByTitle(ticket.description)).toContainText(formatMoney(ticketCostOverBudget));
  });

  await sectionTabs.clickTab(TripSectionTab.Costs);

  // then: Budżet ma status przekroczenia.
  await test.step("Zweryfikuj przekroczenie budżetu", async () => {
    await expect(costSummary.budget).toContainText(getExpectedSpentText(spentOverBudget, budget));
    await expect(costSummary.budgetStatus).toHaveText(getExpectedBudgetExceededStatus(spentOverBudget, budget));
    await expect(costSummary.budget).toHaveAttribute("data-level", BudgetLevel.Exceeded);
  });
});
