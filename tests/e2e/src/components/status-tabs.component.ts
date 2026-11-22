import { TripStatusLabel } from "@_src/enums/trip.enum";
import { StatusTabModel, StatusTabsModel } from "@_src/models/status-tab.model";
import { step } from "@_src/utils/step.decorator";
import { Locator, Page } from "@playwright/test";

export class StatusTabsComponent {
  allTab: Locator;
  plannedTab: Locator;
  inProgressTab: Locator;
  completedTab: Locator;
  archivedTab: Locator;
  tabs: Locator;
  activeTab: Locator;

  constructor(private page: Page) {
    this.tabs = this.page.getByTestId(/^status-tab-/);
    this.activeTab = this.tabs.and(this.page.getByRole("tab", { selected: true }));
    this.allTab = this.page.getByTestId("status-tab-all");
    this.plannedTab = this.page.getByTestId("status-tab-planned");
    this.inProgressTab = this.page.getByTestId("status-tab-in-progress");
    this.completedTab = this.page.getByTestId("status-tab-completed");
    this.archivedTab = this.page.getByTestId("status-tab-archived");
  }

  getTabForStatus(status: TripStatusLabel): Locator {
    const tabsByStatus: Record<TripStatusLabel, Locator> = {
      [TripStatusLabel.Planned]: this.plannedTab,
      [TripStatusLabel.InProgress]: this.inProgressTab,
      [TripStatusLabel.Completed]: this.completedTab,
      [TripStatusLabel.Archived]: this.archivedTab,
    };

    return tabsByStatus[status];
  }

  // Odczyt liczników jako punkt odniesienia (np. przed dodaniem podróży). Zmiany po akcji sprawdzamy
  // asercją z ponawianiem na lokatorze zakładki, np. toHaveText(getExpectedStatusTabText(...)).
  @step("Odczytaj nazwy i liczniki zakładek statusów")
  async getTabs(): Promise<StatusTabsModel> {
    return {
      all: await this.readTab(this.allTab),
      planned: await this.readTab(this.plannedTab),
      inProgress: await this.readTab(this.inProgressTab),
      completed: await this.readTab(this.completedTab),
      archived: await this.readTab(this.archivedTab),
    };
  }

  async readTab(tab: Locator): Promise<StatusTabModel> {
    const tabText = (await tab.textContent()) ?? "";
    const words = tabText.trim().split(" ");
    const count = Number(words.pop());

    return { name: words.join(" "), count };
  }

  @step((status: TripStatusLabel) => `Wybierz zakładkę ze statusem „${status}”`)
  async clickTabForStatus(status: TripStatusLabel): Promise<void> {
    await this.getTabForStatus(status).click();
  }

  @step("Wybierz zakładkę „Wszystkie”")
  async clickAllTab(): Promise<void> {
    await this.allTab.click();
  }

  @step("Wybierz zakładkę „W planie”")
  async clickPlannedTab(): Promise<void> {
    await this.plannedTab.click();
  }

  @step("Wybierz zakładkę „W trakcie”")
  async clickInProgressTab(): Promise<void> {
    await this.inProgressTab.click();
  }

  @step("Wybierz zakładkę „Zrealizowane”")
  async clickCompletedTab(): Promise<void> {
    await this.completedTab.click();
  }

  @step("Wybierz zakładkę „Archiwum”")
  async clickArchivedTab(): Promise<void> {
    await this.archivedTab.click();
  }
}
