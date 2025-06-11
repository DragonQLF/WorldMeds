export interface CountryDetails {
  id: string;
  name: string;
  currency: string;
  total_medicines: number;
  avg_price: number;
  using_reference_price: number;
}

export interface MedicineDetails {
  id: string;
  name: string;
  dosage: string;
  total_quantity: number;
  using_reference_price: number;
}

export interface CountryMedicineData {
  id: string;
  name: string;
  avg_price: number;
  currency: string;
  total_quantity: number;
}

export interface PriceChange {
  value: number;
  increased: boolean;
  percentage: string;
} 