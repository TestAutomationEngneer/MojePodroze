import { expect, test } from "@_src/fixtures/merge.fixture";
import { testUser1 } from "@_src/test-data/user.data";

test.use({ trace: "off", screenshot: "off" });

test("Logowanie poprawnymi danymi otwiera stronę Moje podróże @smoke", async ({ loginPage, page }) => {
  // given: Użytkownik testowy jest na stronie logowania.
  const expectedTitle = "Moje podróże";
  await loginPage.goto();

  // when: Użytkownik loguje się poprawnym loginem i hasłem.
  const myTripsPage = await loginPage.login(testUser1);
  const { mainMenu, newTripButton } = myTripsPage;

  // then: Otwiera się strona „Moje podróże” z menu zalogowanego użytkownika.
  await test.step("Zweryfikuj otwarcie strony Moje podróże", async () => {
    await expect(page).toHaveURL(myTripsPage.url);
    await expect(page).toHaveTitle(expectedTitle);
    await expect(mainMenu.myTripsTab, "Aktywna zakładka menu to „Moje podróże”").toHaveAttribute("aria-current", "page");
    await expect(newTripButton).toBeVisible();
  });

  await test.step("Zweryfikuj, że użytkownik jest zalogowany", async () => {
    await expect(mainMenu.logoutButton).toBeVisible();
  });
});
