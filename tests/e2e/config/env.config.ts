import * as dotenv from "dotenv";

// Ta sama strefa czasowa co w przeglądarce (timezoneId w playwright.config.ts). Dzięki temu daty
// liczone w testach („dziś”, „za 30 dni”) zgadzają się z datami w aplikacji także w CI na UTC.
export const TIMEZONE = "Europe/Warsaw";
process.env.TZ = TIMEZONE;

dotenv.config({ override: true, quiet: true });

function requireEnvVariable(envVariableName: string): string {
  const envVariableValue = process.env[envVariableName];
  if (envVariableValue === undefined) {
    throw new Error(`Environment variable ${envVariableName} is not set.`);
  }
  return envVariableValue;
}

export const USER_LOGIN = requireEnvVariable("USER_LOGIN");
export const USER_PASSWORD = requireEnvVariable("USER_PASSWORD");
