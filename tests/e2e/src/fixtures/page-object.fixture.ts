import { LoginPage } from "@_src/pages/login.page";
import { MyTripsPage } from "@_src/pages/my-trips.page";
import { test as baseTest } from "@playwright/test";

interface Pages {
  loginPage: LoginPage;
  myTripsPage: MyTripsPage;
}

// Fixture'y tworzą page objecty, ale nie otwierają strony. Test sam woła `goto()` po przygotowaniu
// danych przez API – inaczej strona byłaby otwierana dwa razy (przed danymi i po nich).
export const pageObjectTest = baseTest.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  myTripsPage: async ({ page }, use) => {
    await use(new MyTripsPage(page));
  },
});
