import { TRIP_SECTION_TAB_KEYS, TripSectionTab } from "@_src/enums/trip.enum";
import { step } from "@_src/utils/step.decorator";
import { Locator, Page } from "@playwright/test";

export class SectionTabsComponent {
  tabs: Locator;
  activeTab: Locator;

  constructor(private page: Page) {
    this.tabs = this.page.getByTestId(/^section-tab-/);
    this.activeTab = this.tabs.and(this.page.getByRole("tab", { selected: true }));
  }

  getTab(tabName: TripSectionTab): Locator {
    return this.page.getByTestId(`section-tab-${TRIP_SECTION_TAB_KEYS[tabName]}`);
  }

  @step((tabName: TripSectionTab) => `Przejdź do zakładki „${tabName}”`)
  async clickTab(tabName: TripSectionTab): Promise<void> {
    await this.getTab(tabName).click();
  }
}
