export function formatAmount(amount: number): string {
  return amount.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatMoney(amount: number): string {
  return `${formatAmount(amount)} zł`;
}

// Budżet tak, jak wpisuje go użytkownik i jak pokazuje go formularz edycji: 3000.5 → „3000,5”.
export function formatFormBudget(budget?: number | null): string {
  if (budget === undefined || budget === null) {
    return "";
  }

  return String(budget).replace(".", ",");
}
