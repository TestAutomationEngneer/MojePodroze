import { step } from "@_src/utils/step.decorator";
import { Page } from "@playwright/test";

export class BasePage {
  url: string;

  constructor(protected page: Page) {
    this.url = "/";
  }

  @step()
  async goto(): Promise<void> {
    await this.page.goto(this.url);
  }

  @step("Odśwież stronę")
  async reload(): Promise<void> {
    await this.page.reload();
  }
}
