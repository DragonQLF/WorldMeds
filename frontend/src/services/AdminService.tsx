
import { api } from "@/lib/api";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface Medicine {
  id: string;
  name: string;
  dosage?: string;
  countryCount?: number;
}

export interface MedicineTransaction {
  id: string;
  saleDate: string;
  quantity: number;
  price: number;
  countryName: string;
  countryId: string;
  pillsPerPackage: number;
}

export interface MedicineCountry {
  id: string;
  name: string;
  currency: string;
  lastPurchaseDate: string;
  lastPrice: number;
  lastQuantity: number;
  pillsPerPackage: number;
}

export interface Country {
  id: string;
  name: string;
  currency: string;
  medicineCount?: number;
}

export interface CountryMedicine {
  id: string;
  name: string;
  dosage: string;
  lastPurchaseDate: string;
  lastPrice: number;
  lastQuantity: number;
  pillsPerPackage: number;
}

// Utility function to handle API errors
const handleApiError = (error: any, defaultMessage: string) => {
  console.error(defaultMessage, error);
  let errorMessage = defaultMessage;
  
  if (error.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  throw new Error(errorMessage);
};

// User CRUD operations
export const fetchUsers = async (): Promise<User[]> => {
  try {
    const response = await api.get('/admin/users');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to fetch users');
    return []; // TypeScript requires a return, but the error will be thrown
  }
};

export const createUser = async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
  try {
    const response = await api.post('/admin/users', userData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to create user');
    throw error; // Re-throw to ensure the error is caught by caller
  }
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  try {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  } catch (error) {
    handleApiError(error, `Failed to update user ${id}`);
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    await api.delete(`/admin/users/${id}`);
  } catch (error) {
    handleApiError(error, `Failed to delete user ${id}`);
  }
};

// Medicine CRUD operations
export const fetchMedicines = async (): Promise<Medicine[]> => {
  try {
    const response = await api.get('/admin/medicines');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to fetch medicines');
    return [];
  }
};

export const createMedicine = async (medicineData: Omit<Medicine, 'id'>): Promise<Medicine> => {
  try {
    const response = await api.post('/admin/medicines', medicineData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to create medicine');
    throw error;
  }
};

export const updateMedicine = async (id: string, medicineData: Partial<Medicine>): Promise<Medicine> => {
  try {
    const response = await api.put(`/admin/medicines/${id}`, medicineData);
    return response.data;
  } catch (error) {
    handleApiError(error, `Failed to update medicine ${id}`);
    throw error;
  }
};

export const deleteMedicine = async (id: string): Promise<void> => {
  try {
    await api.delete(`/admin/medicines/${id}`);
  } catch (error) {
    handleApiError(error, `Failed to delete medicine ${id}`);
  }
};

// Get detailed information for a medicine
export const fetchMedicineDetails = async (medicineId: string): Promise<Medicine> => {
  try {
    const response = await api.get(`/admin/medicines/${medicineId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, `Failed to fetch details for medicine ${medicineId}`);
    throw error;
  }
};

// Fetch medicine transactions
export const fetchMedicineTransactions = async (medicineId: string): Promise<MedicineTransaction[]> => {
  try {
    const response = await api.get(`/admin/medicines/${medicineId}/transactions`);
    return response.data;
  } catch (error) {
    const errorMessage = `Failed to fetch transactions for medicine ${medicineId}`;
    console.error(errorMessage, error);
    return [];
  }
};

// New function to fetch countries for a medicine
export const fetchMedicineCountries = async (medicineId: string): Promise<MedicineCountry[]> => {
  try {
    const response = await api.get(`/admin/medicines/${medicineId}/countries`);
    return response.data;
  } catch (error) {
    const errorMessage = `Failed to fetch countries for medicine ${medicineId}`;
    console.error(errorMessage, error);
    return [];
  }
};

// Country CRUD operations
export const fetchCountries = async (): Promise<Country[]> => {
  try {
    const response = await api.get('/admin/countries');
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to fetch countries');
    return [];
  }
};

export const createCountry = async (countryData: Omit<Country, 'id'>): Promise<Country> => {
  try {
    const response = await api.post('/admin/countries', countryData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to create country');
    throw error;
  }
};

export const updateCountry = async (id: string, countryData: Partial<Country>): Promise<Country> => {
  try {
    const response = await api.put(`/admin/countries/${id}`, countryData);
    return response.data;
  } catch (error) {
    handleApiError(error, `Failed to update country ${id}`);
    throw error;
  }
};

export const deleteCountry = async (id: string): Promise<void> => {
  try {
    await api.delete(`/admin/countries/${id}`);
  } catch (error) {
    handleApiError(error, `Failed to delete country ${id}`);
  }
};

// Get detailed information for a country
export const fetchCountryDetails = async (countryId: string): Promise<Country> => {
  try {
    const response = await api.get(`/admin/countries/${countryId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, `Failed to fetch details for country ${countryId}`);
    throw error;
  }
};

// New function to fetch medicines for a country
export const fetchCountryMedicines = async (countryId: string): Promise<CountryMedicine[]> => {
  try {
    const response = await api.get(`/admin/countries/${countryId}/medicines`);
    return response.data;
  } catch (error) {
    const errorMessage = `Failed to fetch medicines for country ${countryId}`;
    console.error(errorMessage, error);
    return [];
  }
};

// Dashboard statistics
export const fetchDashboardStats = async (): Promise<{
  users: number;
  medicines: number;
  countries: number;
  onlineUsers: number;
  anonymousVisitors: number;
  totalVisitors: number;
}> => {
  try {
    const response = await api.get('/admin/stats');
    return {
      ...response.data,
      onlineUsers: response.data.onlineUsers || 0,
      anonymousVisitors: response.data.anonymousVisitors || 0,
      totalVisitors: response.data.totalVisitors || response.data.onlineUsers || 0
    };
  } catch (error) {
    handleApiError(error, 'Failed to fetch dashboard statistics');
    // Return default values in case of error
    return { 
      users: 0, 
      medicines: 0, 
      countries: 0, 
      onlineUsers: 0,
      anonymousVisitors: 0,
      totalVisitors: 0
    };
  }
};
