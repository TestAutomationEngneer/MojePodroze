import { WidgetsMock } from "@_src/mocks/widgets.mock";
import { test as baseTest } from "@playwright/test";

interface Mocks {
  widgetsMock: WidgetsMock;
}

export const mockTest = baseTest.extend<Mocks>({
  widgetsMock: async ({ page }, use) => {
    await use(new WidgetsMock(page));
  },
});
