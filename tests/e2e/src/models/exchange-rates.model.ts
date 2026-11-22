import { CurrencyCode } from "@_src/enums/currency.enum";

export interface ExchangeRateModel {
  code: CurrencyCode;
  currency: string;
  mid: number;
}

export interface ExchangeRatesModel {
  table_no: string;
  effective_date: string;
  rates: ExchangeRateModel[];
}
