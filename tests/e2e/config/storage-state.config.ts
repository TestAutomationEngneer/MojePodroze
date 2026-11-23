import * as path from "path";

// Sesja zalogowanego użytkownika testowego, zapisywana w global.setup.ts (plik ignorowany przez gita).
export const STORAGE_STATE = path.join(__dirname, "..", "tmp", "session.json");
