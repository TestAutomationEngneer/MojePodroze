import { apiTest } from "@_src/fixtures/api.fixture";
import { mockTest } from "@_src/fixtures/mock.fixture";
import { pageObjectTest } from "@_src/fixtures/page-object.fixture";
import { mergeTests } from "@playwright/test";

export const test = mergeTests(pageObjectTest, apiTest, mockTest);

export { expect } from "@playwright/test";
