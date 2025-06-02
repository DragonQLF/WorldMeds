import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, formatCurrencyWithSymbol, convertToUSD } from "@/lib/api";
import { 
  BarChart2, 
  ChevronDown, 
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  Crown,
  X,
  Plus,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from "recharts";
import { useMapContext } from "@/contexts/MapContext";

const MAX_MEDICINES = 5;
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface ComparisonViewProps {
  onClose?: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ onClose }) => {
  const { toast } = useToast();
  const { selectedDate, dateRange, selectedMonth, useTimeFiltering } = useMapContext();

  const [selectedMedicines, setSelectedMedicines] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "chart">("chart");
  const [sortBy, setSortBy] = useState<"name" | "price">("price");

  // Fetch medicines list from the API
  const { data: medicines, isLoading: loadingMedicines } = useQuery({
    queryKey: ['medicines'],
    queryFn: async () => {
      const response = await api.get('/comparison/medicines');
      return response.data;
    }
  });

  // Fetch available countries based on selected medicines
  const { data: availableCountries, isLoading: loadingAvailableCountries } = useQuery({
    queryKey: ['countries', selectedMedicines],
    queryFn: async () => {
      if (!selectedMedicines.length) {
        return [];
      }
      
      const medicineIds = selectedMedicines.join(',');
      
      // Add date/month filtering to the query
      let dateParams = '';
      if (useTimeFiltering) {
        if (selectedDate) {
          dateParams = `&date=${selectedDate.toISOString().split('T')[0]}`;
        } else if (dateRange && dateRange.from) {
          const from = dateRange.from.toISOString().split('T')[0];
          const to = dateRange.to ? dateRange.to.toISOString().split('T')[0] : '';
          dateParams = `&start=${from}${to ? `&end=${to}` : ''}`;
        } else if (selectedMonth && selectedMonth !== 'all') {
          dateParams = `&month=${selectedMonth}`;
        }
      }

      const response = await api.get(`/comparison/countries?medicines=${medicineIds}${dateParams}`);
      return response.data;
    },
    enabled: selectedMedicines.length > 0
  });

  // Fetch available medicines based on selected countries (for validation)
  const { data: availableMedicines } = useQuery({
    queryKey: ['medicines', selectedCountries],
    queryFn: async () => {
      if (!selectedCountries.length) {
        return medicines || [];
      }
      
      const countryIds = selectedCountries.join(',');

      // Add date/month filtering to the query
      let dateParams = '';
      if (useTimeFiltering) {
        if (selectedDate) {
          dateParams = `&date=${selectedDate.toISOString().split('T')[0]}`;
        } else if (dateRange && dateRange.from) {
          const from = dateRange.from.toISOString().split('T')[0];
          const to = dateRange.to ? dateRange.to.toISOString().split('T')[0] : '';
          dateParams = `&start=${from}${to ? `&end=${to}` : ''}`;
        } else if (selectedMonth && selectedMonth !== 'all') {
          dateParams = `&month=${selectedMonth}`;
        }
      }
      
      const response = await api.get(`/comparison/medicines?countries=${countryIds}${dateParams}`);
      return response.data;
    },
    enabled: selectedCountries.length > 0
  });

  // Initialize comparison data query
  const { data: comparisonData, isLoading: loadingComparison } = useQuery({
    queryKey: ['comparison-data', selectedMedicines, selectedCountries],
    queryFn: async () => {
      if (!selectedMedicines.length || !selectedCountries.length) {
        return [];
      }
      
      // Build query params
      const medicineIds = selectedMedicines.join(',');
      const countryIds = selectedCountries.join(',');
      const url = `/comparison/data?medicineIds=${medicineIds}&countries=${countryIds}&mode=medicine`;
      
      const response = await api.get(url);
      return response.data;
    },
    enabled: selectedMedicines.length > 0 && selectedCountries.length > 0
  });

  // Formatting and preparing data for display
  const prepareDisplayData = async () => {
    if (!comparisonData || comparisonData.length === 0) return [];
    
    const displayData = [...comparisonData];
    
    // Always use USD for multiple countries comparison
    if (displayData.length > 0) {
      for (let i = 0; i < displayData.length; i++) {
        const item = displayData[i];
        if (item.currency && item.currency.toUpperCase() !== 'USD') {
          try {
            const usdPrice = await convertToUSD(item.price, item.currency);
            item.displayPrice = usdPrice;
            item.displayCurrency = 'USD';
          } catch (error) {
            console.error("Error converting to USD:", error);
            item.displayPrice = item.price;
            item.displayCurrency = item.currency || 'USD';
          }
        } else {
          item.displayPrice = item.price;
          item.displayCurrency = item.currency || 'USD';
        }
      }
    }
    
    return displayData;
  };

  // Use React state to store processed display data
  const [processedData, setProcessedData] = useState<any[]>([]);
  
  // Update processed data whenever raw data or currency preference changes
  useEffect(() => {
    if (comparisonData && comparisonData.length > 0) {
      prepareDisplayData().then(data => {
        // Apply sorting
        const sortedData = [...data].sort((a, b) => {
          if (sortBy === "price") {
            return a.displayPrice - b.displayPrice;
          } else {
            const nameA = a.country || '';
            const nameB = b.country || '';
            return nameA.localeCompare(nameB);
          }
        });
        setProcessedData(sortedData);
      });
    } else {
      setProcessedData([]);
    }
  }, [comparisonData, selectedCountries, sortBy]);

  // Clean up selected medicines when countries change to prevent invalid selections
  useEffect(() => {
    if (selectedCountries.length > 0 && availableMedicines) {
      const validMedicineIds = availableMedicines.map(m => m.id);
      const filteredMedicines = selectedMedicines.filter(id => validMedicineIds.includes(id));
      
      if (filteredMedicines.length !== selectedMedicines.length) {
        setSelectedMedicines(filteredMedicines);
        const removedCount = selectedMedicines.length - filteredMedicines.length;
        if (removedCount > 0) {
          toast({
            title: "Medicines filtered",
            description: `${removedCount} medicine(s) removed as they're not available in the selected countries.`
          });
        }
      }
    }
  }, [selectedCountries, availableMedicines, selectedMedicines, toast]);
  
  // Find cheapest and most expensive items
  const findExtremes = () => {
    if (!processedData || processedData.length <= 1) {
      return { cheapest: null, mostExpensive: null };
    }
    
    let cheapest = processedData[0];
    let mostExpensive = processedData[0];
    
    // Compare using displayPrice which is already converted to consistent currency
    processedData.forEach(item => {
      if (item.displayPrice < cheapest.displayPrice) cheapest = item;
      if (item.displayPrice > mostExpensive.displayPrice) mostExpensive = item;
    });
    
    return { cheapest, mostExpensive };
  };
  
  const { cheapest, mostExpensive } = findExtremes();

  // Calculate savings percentage between highest and lowest prices
  const calculateSavings = () => {
    if (!mostExpensive || !cheapest || mostExpensive.displayPrice === cheapest.displayPrice) {
      return "0.0";
    }
    return ((mostExpensive.displayPrice - cheapest.displayPrice) / mostExpensive.displayPrice * 100).toFixed(1);
  };

  // Handle medicine selection (with validation)
  const handleMedicineToggle = (medicineId: string) => {
    if (selectedMedicines.includes(medicineId)) {
      setSelectedMedicines(selectedMedicines.filter(id => id !== medicineId));
    } else if (selectedMedicines.length < MAX_MEDICINES) {
      // Check if this medicine is available in selected countries
      if (selectedCountries.length > 0 && availableMedicines) {
        const isAvailable = availableMedicines.some(m => m.id === medicineId);
        if (!isAvailable) {
          toast({
            variant: "destructive",
            title: "Medicine not available",
            description: "This medicine is not available in the selected countries."
          });
          return;
        }
      }
      setSelectedMedicines([...selectedMedicines, medicineId]);
    } else {
      toast({
        variant: "destructive",
        title: "Selection limit reached",
        description: `You can only compare up to ${MAX_MEDICINES} medicines at once`
      });
    }
  };

  // Handle country selection
  const handleCountryToggle = (countryId: string) => {
    if (selectedCountries.includes(countryId)) {
      setSelectedCountries(selectedCountries.filter(id => id !== countryId));
    } else {
      setSelectedCountries([...selectedCountries, countryId]);
    }
  };

  // Enhanced item management functions
  const handleRemoveMedicine = (medicineId: string) => {
    setSelectedMedicines(selectedMedicines.filter(id => id !== medicineId));
  };

  const handleRemoveCountry = (countryId: string) => {
    setSelectedCountries(selectedCountries.filter(id => id !== countryId));
  };

  // Format data for charts
  const getFormattedChartData = () => {
    if (!processedData || processedData.length === 0) return [];
    
    return processedData.map(item => ({
      name: item.country || 'Unknown',
      price: item.displayPrice || 0,
      currency: item.displayCurrency || 'USD',
      priceFmt: formatCurrencyWithSymbol(item.displayPrice || 0, item.displayCurrency || 'USD'),
      medicine: item.medicine || "Selected Medicine"
    }));
  };

  // Format data for trend chart with safety checks
  const getFormattedTrendData = () => {
    if (!processedData || processedData.length === 0) return [];
    
    // Return array with each country and their trend data
    return processedData.map(item => ({
      name: item.country || 'Unknown',
      data: Array.isArray(item.trendData) ? item.trendData.map(trend => ({
        ...trend,
        currency: trend.currency || item.displayCurrency || 'USD'
      })) : []
    }));
  };
  
  // Combined loading state
  const isLoading = loadingMedicines || loadingAvailableCountries || loadingComparison;

  // Enhanced custom tooltip for charts with safety checks
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && label) {
      const data = payload[0];
      const isCheapest = cheapest && label === cheapest.country;
      
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 animate-fade-in">
          <p className="font-medium text-foreground">{label}</p>
          <div className="flex items-center gap-2 mt-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: data.color || '#3b82f6' }}
            />
            <span className="text-sm">
              {data.payload && data.payload.currency 
                ? formatCurrencyWithSymbol(data.value || 0, data.payload.currency)
                : `$${(data.value || 0).toFixed(2)}`}
            </span>
            {isCheapest && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                <Crown className="w-3 h-3 mr-1" />
                Cheapest
              </Badge>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Get the list of medicines to show based on country selection
  const getMedicinesToShow = () => {
    if (selectedCountries.length > 0 && availableMedicines) {
      return availableMedicines;
    }
    return medicines || [];
  };

  return (
    <div className="w-full space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Medicine Price Comparison
          </h1>
          <p className="text-muted-foreground">
            Compare prices across countries and find the best deals
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            Sort by:
          </div>
          <Select value={sortBy} onValueChange={(value: "name" | "price") => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Enhanced Selection Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                  </div>
                  Select Medicines
                </CardTitle>
                <CardDescription>
                  Choose up to {MAX_MEDICINES} medicines to compare
                  {selectedCountries.length > 0 && " (filtered by selected countries)"}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-sm">
                {selectedMedicines.length}/{MAX_MEDICINES}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected medicines with remove buttons */}
            {selectedMedicines.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Selected:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedMedicines.map(medicineId => {
                    const medicine = getMedicinesToShow().find(m => m.id === medicineId);
                    return (
                      <Badge key={medicineId} variant="secondary" className="gap-2">
                        {medicine?.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleRemoveMedicine(medicineId)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
            
            <ScrollArea className="h-48">
              {loadingMedicines ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid gap-2 pr-4">
                  {getMedicinesToShow().map(medicine => {
                    const isSelected = selectedMedicines.includes(medicine.id);
                    const isDisabled = !isSelected && selectedMedicines.length >= MAX_MEDICINES;
                    
                    return (
                      <Button
                        key={medicine.id}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => handleMedicineToggle(medicine.id)}
                        className={cn(
                          "justify-start text-left h-auto p-3 transition-all",
                          isSelected 
                            ? "ring-2 ring-primary/20" 
                            : "hover:border-primary/50",
                          isDisabled && "opacity-50"
                        )}
                        disabled={isDisabled}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            isSelected 
                              ? "bg-primary-foreground" 
                              : "bg-muted-foreground"
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{medicine.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {medicine.active_ingredient}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="text-primary">
                              <Plus className="w-4 h-4 rotate-45" />
                            </div>
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CircleDollarSign className="w-4 h-4 text-green-600 dark:text-green-300" />
                  </div>
                  Select Countries
                </CardTitle>
                <CardDescription>
                  Choose countries to compare prices
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => availableCountries?.length > 0 && setSelectedCountries(availableCountries.map(c => c.id))}
                disabled={loadingAvailableCountries || !availableCountries?.length}
              >
                Select All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected countries with remove buttons */}
            {selectedCountries.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Selected:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCountries.map(countryId => {
                    const country = availableCountries?.find(c => c.id === countryId);
                    return (
                      <Badge key={countryId} variant="secondary" className="gap-2">
                        {country?.name} ({country?.currency})
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleRemoveCountry(countryId)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            <ScrollArea className="h-48">
              {(loadingAvailableCountries || (!availableCountries && selectedMedicines.length > 0)) ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {availableCountries?.length > 0 ? (
                    <div className="grid gap-2">
                      {availableCountries.map(country => (
                        <Button
                          key={country.id}
                          variant={selectedCountries.includes(country.id) ? "default" : "outline"}
                          onClick={() => handleCountryToggle(country.id)}
                          className={cn(
                            "justify-start h-auto p-3 transition-all",
                            selectedCountries.includes(country.id) 
                              ? "ring-2 ring-primary/20" 
                              : "hover:border-primary/50"
                          )}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              selectedCountries.includes(country.id) 
                                ? "bg-primary-foreground" 
                                : "bg-muted-foreground"
                            )} />
                            <div className="flex-1 text-left">
                              <div className="font-medium">{country.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Currency: {country.currency}
                              </div>
                            </div>
                            {selectedCountries.includes(country.id) && (
                              <div className="text-primary">
                                <Plus className="w-4 h-4 rotate-45" />
                              </div>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      {selectedMedicines.length === 0 
                        ? "Select at least one medicine to see available countries" 
                        : "No countries have data for all the selected medicines"}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Loading State */}
      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading comparison data...</p>
          </CardContent>
        </Card>
      ) : processedData.length > 0 ? (
        <div className="space-y-6">
          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-300">
                      Countries
                    </p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {selectedCountries.length}
                    </p>
                  </div>
                  <BarChart2 className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-300">
                      Cheapest Option
                    </p>
                    <p className="text-lg font-bold text-green-900 dark:text-green-100 truncate">
                      {cheapest ? cheapest.country : "N/A"}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-200">
                      {cheapest 
                        ? formatCurrencyWithSymbol(cheapest.displayPrice, cheapest.displayCurrency) 
                        : "No data"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Crown className="h-6 w-6 text-green-600 dark:text-green-300" />
                    <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-300">
                      Most Expensive
                    </p>
                    <p className="text-lg font-bold text-red-900 dark:text-red-100 truncate">
                      {mostExpensive ? mostExpensive.country : "N/A"}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-200">
                      {mostExpensive 
                        ? formatCurrencyWithSymbol(mostExpensive.displayPrice, mostExpensive.displayCurrency) 
                        : "No data"}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-red-600 dark:text-red-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-300">
                      Potential Savings
                    </p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                      {calculateSavings()}%
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-200">
                      vs highest price
                    </p>
                  </div>
                  <CircleDollarSign className="h-8 w-8 text-purple-600 dark:text-purple-300" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Comparison Results */}
          <Card className="border-2">
            <CardHeader className="border-b bg-muted/50">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">
                    {selectedMedicines.length} Medicine{selectedMedicines.length > 1 ? "s" : ""} Across Countries
                  </CardTitle>
                  <CardDescription>
                    Sorted by {sortBy === "price" ? "price (lowest first)" : "name (A-Z)"}
                  </CardDescription>
                </div>
                <div className="flex items-center border rounded-lg">
                  <Button 
                    variant={viewMode === "chart" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("chart")}
                    className="rounded-r-none"
                  >
                    Chart
                  </Button>
                  <Button 
                    variant={viewMode === "table" ? "default" : "ghost"} 
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className="rounded-l-none"
                  >
                    Table
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <Tabs defaultValue="bar" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                  <TabsTrigger value="trend">Trend Analysis</TabsTrigger>
                </TabsList>
                
                <TabsContent value="bar" className="space-y-0">
                  {viewMode === "chart" ? (
                    <div className="h-[500px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={getFormattedChartData()} 
                          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={80}
                            interval={0}
                            tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                          />
                          <YAxis 
                            label={{ 
                              value: `Price (${getFormattedChartData()[0]?.currency || 'USD'})`, 
                              angle: -90, 
                              position: 'insideLeft',
                              style: { textAnchor: 'middle', fill: "hsl(var(--foreground))" }
                            }}
                            tick={{ fill: "hsl(var(--foreground))" }}
                          />
                          <Tooltip 
                            content={<CustomTooltip />}
                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                          />
                          <Bar 
                            dataKey="price" 
                            name="Price" 
                            radius={[4, 4, 0, 0]}
                            className="animate-fade-in"
                          >
                            {getFormattedChartData().map((entry, index) => {
                              const isCheapest = cheapest && entry.name === cheapest.country;
                              const isMostExpensive = mostExpensive && entry.name === mostExpensive.country;
                              
                              return (
                                <Bar
                                  key={`cell-${index}`}
                                  fill={
                                    isCheapest ? "#10b981" : 
                                    isMostExpensive ? "#ef4444" : 
                                    COLORS[index % COLORS.length]
                                  }
                                />
                              );
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-8"></TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Currency</TableHead>
                            <TableHead>Difference</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {processedData.map((item, index) => {
                            const isCheapest = cheapest && item.country === cheapest.country;
                            const isMostExpensive = mostExpensive && item.country === mostExpensive.country;
                            
                            return (
                              <TableRow 
                                key={index}
                                className={cn(
                                  "animate-fade-in",
                                  isCheapest && "bg-green-50 dark:bg-green-950/20 border-l-4 border-l-green-500",
                                  isMostExpensive && "bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-500"
                                )}
                              >
                                <TableCell>
                                  <div 
                                    className="w-4 h-4 rounded-full" 
                                    style={{ 
                                      backgroundColor: isCheapest ? "#10b981" : 
                                        isMostExpensive ? "#ef4444" : 
                                        COLORS[index % COLORS.length] 
                                    }} 
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  {item.country}
                                </TableCell>
                                <TableCell className="font-mono">
                                  {formatCurrencyWithSymbol(item.displayPrice, item.displayCurrency)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{item.displayCurrency}</Badge>
                                </TableCell>
                                <TableCell>
                                  {cheapest && !isCheapest ? (
                                    <div className="flex items-center gap-1 text-red-600">
                                      <TrendingUp className="w-4 h-4" />
                                      +{((item.displayPrice - cheapest.displayPrice) / cheapest.displayPrice * 100).toFixed(1)}%
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-green-600">
                                      <TrendingDown className="w-4 h-4" />
                                      Base
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isCheapest && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                      <Crown className="w-3 h-3 mr-1" />
                                      Cheapest
                                    </Badge>
                                  )}
                                  {isMostExpensive && (
                                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                                      Most Expensive
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </TabsContent>
                
                <TabsContent value="trend" className="space-y-0">
                  <div className="h-[500px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="month" 
                          type="category" 
                          allowDuplicatedCategory={false}
                          tick={{ fill: "hsl(var(--foreground))" }}
                        />
                        <YAxis 
                          label={{ 
                            value: 'Price', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { textAnchor: 'middle', fill: "hsl(var(--foreground))" }
                          }}
                          tick={{ fill: "hsl(var(--foreground))" }}
                        />
                        <Tooltip 
                          content={<CustomTooltip />}
                          cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "3 3" }}
                        />
                        <Legend />
                        {getFormattedTrendData().map((series, index) => (
                          <Line 
                            key={series.name}
                            data={series.data} 
                            type="monotone" 
                            dataKey="price" 
                            name={series.name} 
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={3}
                            dot={{ r: 6, strokeWidth: 2, fill: "hsl(var(--background))" }}
                            activeDot={{ r: 8, strokeWidth: 2 }}
                            className="animate-fade-in"
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <BarChart2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle className="mb-2">No Data to Display</CardTitle>
            <CardDescription className="max-w-md">
              {selectedMedicines.length === 0
                ? "Please select at least one medicine to start comparing prices"
                : selectedCountries.length === 0
                ? "Please select at least one country to see price comparisons"
                : "No data available for the selected combination. Try selecting different medicines or countries."}
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
