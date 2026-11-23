import { StatusTabLabel, TRIP_CHARACTER_LABELS, TRIP_TYPE_LABELS } from "@_src/enums/trip.enum";
import { TripCardModel } from "@_src/models/trip-card.model";
import { AddTripModel } from "@_src/models/trip.model";
import { formatTripCardDate, getTripDurationDays } from "@_src/utils/date.util";
import { formatMoney } from "@_src/utils/money.util";

// Wiersz z datami, typem i charakterem (karta i nagłówek szczegółów). Separator „ · ” jest dla oka,
// a ukryte wizualnie „, ” dla czytnika ekranu – oba są w textContent.
const META_SEPARATOR = " · , ";

export function parseTripMetaText(text: string): Omit<TripCardModel, "tripName" | "status"> {
  const [dates, tripType, tripCharacter] = text.split(META_SEPARATOR);
  const [tripDateFrom, tripDateTo] = dates.split(" – ");

  return { tripDateFrom, tripDateTo, tripType, tripCharacter };
}

export function getExpectedTripMetaText(trip: AddTripModel): string {
  return [
    `${formatTripCardDate(trip.start_date)} – ${formatTripCardDate(trip.end_date)}`,
    TRIP_TYPE_LABELS[trip.trip_type],
    TRIP_CHARACTER_LABELS[trip.character_id],
  ].join(META_SEPARATOR);
}

// Wartości z zakładki „Przegląd”: cel, termin, czas trwania, budżet
export function getExpectedOverviewValues(trip: AddTripModel): string[] {
  const durationDays = getTripDurationDays(trip.start_date, trip.end_date);

  return [
    `${trip.destination_city}, ${trip.destination_country}`,
    `${formatTripCardDate(trip.start_date)} – ${formatTripCardDate(trip.end_date)}`,
    durationDays === 1 ? "1 dzień" : `${durationDays} dni`,
    formatBudget(trip.planned_budget),
  ];
}

export function getExpectedStatusTabText(label: StatusTabLabel, count: number): string {
  return `${label} ${count}`;
}

function formatBudget(budget?: number | null): string {
  if (budget === undefined || budget === null) {
    return "nie ustalono";
  }

  return formatMoney(budget);
}
