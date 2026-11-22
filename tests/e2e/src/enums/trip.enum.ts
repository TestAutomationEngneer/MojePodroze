import type { TripStatus } from "@_src/models/trip.model";

export enum TripType {
  Domestic = "domestic",
  Foreign = "foreign",
}

export enum TripCharacterId {
  Mountains = 1,
  Sea = 2,
  City = 3,
  Lakes = 4,
  Countryside = 5,
  Other = 6,
}

export enum TripStatusLabel {
  Planned = "W planie",
  InProgress = "W trakcie",
  Completed = "Zrealizowana",
  Archived = "Archiwum",
}

export enum StatusTabLabel {
  All = "Wszystkie",
  Planned = "W planie",
  InProgress = "W trakcie",
  Completed = "Zrealizowane",
  Archived = "Archiwum",
}

export enum TripSectionTab {
  Overview = "Przegląd",
  Plan = "Plan dnia",
  Flights = "Loty",
  Transport = "Transport",
  Meals = "Posiłki",
  Places = "Noclegi i atrakcje",
  Expenses = "Wydatki inne",
  Wishlist = "Chcę odwiedzić",
  Packing = "Pakowanie",
  Diary = "Pamiętnik",
  Costs = "Kosztorys",
}

// Końcówki data-testid zakładek: section-tab-{klucz}
export const TRIP_SECTION_TAB_KEYS: Record<TripSectionTab, string> = {
  [TripSectionTab.Overview]: "przeglad",
  [TripSectionTab.Plan]: "plan",
  [TripSectionTab.Flights]: "loty",
  [TripSectionTab.Transport]: "transport",
  [TripSectionTab.Meals]: "posilki",
  [TripSectionTab.Places]: "noclegi",
  [TripSectionTab.Expenses]: "wydatki",
  [TripSectionTab.Wishlist]: "chce-odwiedzic",
  [TripSectionTab.Packing]: "pakowanie",
  [TripSectionTab.Diary]: "pamietnik",
  [TripSectionTab.Costs]: "kosztorys",
};

export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  [TripType.Domestic]: "Krajowa",
  [TripType.Foreign]: "Zagraniczna",
};

export const TRIP_CHARACTER_LABELS: Record<TripCharacterId, string> = {
  [TripCharacterId.Mountains]: "Góry",
  [TripCharacterId.Sea]: "Morze",
  [TripCharacterId.City]: "Miasto",
  [TripCharacterId.Lakes]: "Jeziora",
  [TripCharacterId.Countryside]: "Wieś",
  [TripCharacterId.Other]: "Inny",
};

export const TRIP_STATUS_LABELS: Record<TripStatus, TripStatusLabel> = {
  planned: TripStatusLabel.Planned,
  in_progress: TripStatusLabel.InProgress,
  completed: TripStatusLabel.Completed,
  archived: TripStatusLabel.Archived,
};
