export interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface MockCountry {
  id: string;
  name: string;
  currency: string;
  currencyCode: string;
  total_medicines: number;
  avg_price: number;
  previous_price: number;
  using_reference_price: number;
  totalExpenses: string;
  totalExpensesUSD: string;
  perCapitaExpenses: string;
  perCapitaExpensesUSD: string;
  priceInflation: number;
  mostBoughtMedicine: string;
  mostBoughtQuantity: number;
  topMedicines: {
    name: string;
    quantity: number;
    price: number;
  }[];
  priceTrends: {
    year: string;
    price: number;
  }[];
  medicineDistribution: {
    name: string;
    value: number;
  }[];
  seasonalData: {
    month: string;
    purchases: number;
  }[];
  marketInsights: {
    totalPharmacies: number;
    averagePharmacyRevenue: string;
    mostExpensiveMedicine: string;
    priceRange: string;
    marketGrowth: string;
    regulatoryStatus: string;
    healthcareSpendingGDP: number;
  };
}

export const mockUsers: MockUser[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    role: "admin",
    createdAt: "2024-01-01",
  },
  {
    id: "2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    role: "user",
    createdAt: "2024-01-15",
  },
  {
    id: "3",
    firstName: "Bob",
    lastName: "Johnson",
    email: "bob.johnson@example.com",
    role: "user",
    createdAt: "2024-02-01",
  },
];

export const mockCountries: MockCountry[] = [
  {
    id: "BR",
    name: "Brazil",
    currency: "BRL",
    currencyCode: "R$",
    total_medicines: 15000,
    avg_price: 45.50,
    previous_price: 42.30,
    using_reference_price: 0,
    totalExpenses: "R$ 150,000,000,000",
    totalExpensesUSD: "$ 30,000,000,000",
    perCapitaExpenses: "R$ 700",
    perCapitaExpensesUSD: "$ 140",
    priceInflation: 8.5,
    mostBoughtMedicine: "Paracetamol",
    mostBoughtQuantity: 2500000,
    topMedicines: [
      { name: "Paracetamol", quantity: 2500000, price: 15.99 },
      { name: "Ibuprofen", quantity: 1800000, price: 22.50 },
      { name: "Omeprazole", quantity: 1200000, price: 35.75 },
      { name: "Metformin", quantity: 950000, price: 28.30 },
      { name: "Losartan", quantity: 800000, price: 42.90 }
    ],
    priceTrends: [
      { year: "2019", price: 38.20 },
      { year: "2020", price: 40.50 },
      { year: "2021", price: 42.30 },
      { year: "2022", price: 45.50 },
      { year: "2023", price: 48.75 }
    ],
    medicineDistribution: [
      { name: "Generic", value: 65 },
      { name: "Brand", value: 25 },
      { name: "Specialty", value: 10 }
    ],
    seasonalData: [
      { month: "Jan", purchases: 1200000 },
      { month: "Feb", purchases: 1150000 },
      { month: "Mar", purchases: 1300000 },
      { month: "Apr", purchases: 1250000 },
      { month: "May", purchases: 1400000 },
      { month: "Jun", purchases: 1350000 },
      { month: "Jul", purchases: 1500000 },
      { month: "Aug", purchases: 1450000 },
      { month: "Sep", purchases: 1600000 },
      { month: "Oct", purchases: 1550000 },
      { month: "Nov", purchases: 1700000 },
      { month: "Dec", purchases: 1650000 }
    ],
    marketInsights: {
      totalPharmacies: 85000,
      averagePharmacyRevenue: "$ 350,000",
      mostExpensiveMedicine: "Sofosbuvir",
      priceRange: "R$ 5 - R$ 50,000",
      marketGrowth: "12%",
      regulatoryStatus: "Strict",
      healthcareSpendingGDP: 9.1
    }
  },
  {
    id: "AR",
    name: "Argentina",
    currency: "ARS",
    currencyCode: "$",
    total_medicines: 12000,
    avg_price: 38.75,
    previous_price: 35.20,
    using_reference_price: 0,
    totalExpenses: "$ 25,000,000,000",
    totalExpensesUSD: "$ 5,000,000,000",
    perCapitaExpenses: "$ 550",
    perCapitaExpensesUSD: "$ 110",
    priceInflation: 12.3,
    mostBoughtMedicine: "Ibuprofen",
    mostBoughtQuantity: 1800000,
    topMedicines: [
      { name: "Ibuprofen", quantity: 1800000, price: 12.50 },
      { name: "Paracetamol", quantity: 1500000, price: 10.25 },
      { name: "Omeprazole", quantity: 900000, price: 28.75 },
      { name: "Metformin", quantity: 750000, price: 22.40 },
      { name: "Losartan", quantity: 600000, price: 35.60 }
    ],
    priceTrends: [
      { year: "2019", price: 32.50 },
      { year: "2020", price: 35.20 },
      { year: "2021", price: 38.75 },
      { year: "2022", price: 42.90 },
      { year: "2023", price: 48.20 }
    ],
    medicineDistribution: [
      { name: "Generic", value: 70 },
      { name: "Brand", value: 20 },
      { name: "Specialty", value: 10 }
    ],
    seasonalData: [
      { month: "Jan", purchases: 900000 },
      { month: "Feb", purchases: 850000 },
      { month: "Mar", purchases: 950000 },
      { month: "Apr", purchases: 900000 },
      { month: "May", purchases: 1000000 },
      { month: "Jun", purchases: 950000 },
      { month: "Jul", purchases: 1100000 },
      { month: "Aug", purchases: 1050000 },
      { month: "Sep", purchases: 1200000 },
      { month: "Oct", purchases: 1150000 },
      { month: "Nov", purchases: 1300000 },
      { month: "Dec", purchases: 1250000 }
    ],
    marketInsights: {
      totalPharmacies: 45000,
      averagePharmacyRevenue: "$ 280,000",
      mostExpensiveMedicine: "Adalimumab",
      priceRange: "$ 10 - $ 40,000",
      marketGrowth: "8%",
      regulatoryStatus: "Moderate",
      healthcareSpendingGDP: 8.5
    }
  },
  {
    id: "MX",
    name: "Mexico",
    currency: "MXN",
    currencyCode: "$",
    total_medicines: 13500,
    avg_price: 42.25,
    previous_price: 39.80,
    using_reference_price: 0,
    totalExpenses: "$ 180,000,000,000",
    totalExpensesUSD: "$ 9,000,000,000",
    perCapitaExpenses: "$ 1,400",
    perCapitaExpensesUSD: "$ 70",
    priceInflation: 6.8,
    mostBoughtMedicine: "Omeprazole",
    mostBoughtQuantity: 2000000,
    topMedicines: [
      { name: "Omeprazole", quantity: 2000000, price: 18.75 },
      { name: "Paracetamol", quantity: 1900000, price: 12.50 },
      { name: "Ibuprofen", quantity: 1600000, price: 15.25 },
      { name: "Metformin", quantity: 1100000, price: 25.80 },
      { name: "Losartan", quantity: 900000, price: 38.40 }
    ],
    priceTrends: [
      { year: "2019", price: 35.60 },
      { year: "2020", price: 37.90 },
      { year: "2021", price: 39.80 },
      { year: "2022", price: 42.25 },
      { year: "2023", price: 45.10 }
    ],
    medicineDistribution: [
      { name: "Generic", value: 60 },
      { name: "Brand", value: 30 },
      { name: "Specialty", value: 10 }
    ],
    seasonalData: [
      { month: "Jan", purchases: 1100000 },
      { month: "Feb", purchases: 1050000 },
      { month: "Mar", purchases: 1200000 },
      { month: "Apr", purchases: 1150000 },
      { month: "May", purchases: 1300000 },
      { month: "Jun", purchases: 1250000 },
      { month: "Jul", purchases: 1400000 },
      { month: "Aug", purchases: 1350000 },
      { month: "Sep", purchases: 1500000 },
      { month: "Oct", purchases: 1450000 },
      { month: "Nov", purchases: 1600000 },
      { month: "Dec", purchases: 1550000 }
    ],
    marketInsights: {
      totalPharmacies: 65000,
      averagePharmacyRevenue: "$ 320,000",
      mostExpensiveMedicine: "Trastuzumab",
      priceRange: "$ 20 - $ 45,000",
      marketGrowth: "10%",
      regulatoryStatus: "Moderate",
      healthcareSpendingGDP: 7.8
    }
  },
  {
    id: "CL",
    name: "Chile",
    currency: "CLP",
    currencyCode: "$",
    total_medicines: 9500,
    avg_price: 48.90,
    previous_price: 45.60,
    using_reference_price: 0,
    totalExpenses: "$ 12,000,000,000,000",
    totalExpensesUSD: "$ 12,000,000,000",
    perCapitaExpenses: "$ 630,000",
    perCapitaExpensesUSD: "$ 630",
    priceInflation: 5.2,
    mostBoughtMedicine: "Metformin",
    mostBoughtQuantity: 1200000,
    topMedicines: [
      { name: "Metformin", quantity: 1200000, price: 22.50 },
      { name: "Paracetamol", quantity: 1100000, price: 14.75 },
      { name: "Ibuprofen", quantity: 950000, price: 18.25 },
      { name: "Omeprazole", quantity: 850000, price: 32.40 },
      { name: "Losartan", quantity: 700000, price: 45.60 }
    ],
    priceTrends: [
      { year: "2019", price: 40.20 },
      { year: "2020", price: 42.80 },
      { year: "2021", price: 45.60 },
      { year: "2022", price: 48.90 },
      { year: "2023", price: 51.40 }
    ],
    medicineDistribution: [
      { name: "Generic", value: 55 },
      { name: "Brand", value: 35 },
      { name: "Specialty", value: 10 }
    ],
    seasonalData: [
      { month: "Jan", purchases: 800000 },
      { month: "Feb", purchases: 750000 },
      { month: "Mar", purchases: 850000 },
      { month: "Apr", purchases: 800000 },
      { month: "May", purchases: 900000 },
      { month: "Jun", purchases: 850000 },
      { month: "Jul", purchases: 950000 },
      { month: "Aug", purchases: 900000 },
      { month: "Sep", purchases: 1000000 },
      { month: "Oct", purchases: 950000 },
      { month: "Nov", purchases: 1100000 },
      { month: "Dec", purchases: 1050000 }
    ],
    marketInsights: {
      totalPharmacies: 35000,
      averagePharmacyRevenue: "$ 380,000",
      mostExpensiveMedicine: "Pembrolizumab",
      priceRange: "$ 15 - $ 55,000",
      marketGrowth: "9%",
      regulatoryStatus: "Strict",
      healthcareSpendingGDP: 8.2
    }
  }
]; 