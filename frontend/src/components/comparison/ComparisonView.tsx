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
  Filter,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
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
  Line,
  Cell
} from "recharts";
import { useMapContext } from "@/contexts/MapContext";

const MAX_MEDICINES = 1;
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
  const [medicineSearch, setMedicineSearch] = useState("");

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

  // Initialize comparison data query
  const { data: comparisonData, isLoading: loadingComparison } = useQuery({
    queryKey: ['comparison-data', selectedMedicines, selectedCountries, selectedDate, dateRange, selectedMonth, useTimeFiltering], // Added date/time filter dependencies
    queryFn: async () => {
      if (!selectedMedicines.length || !selectedCountries.length) {
        return [];
      }

      // Build query params
      const medicineIds = selectedMedicines.join(',');
      const countryIds = selectedCountries.join(',');

      // Add date/month filtering to the query parameters
      let dateParam = '';
      if (useTimeFiltering) {
        if (selectedDate) {
          const formattedDate = selectedDate.toISOString().split('T')[0];
          dateParam = `&date=${formattedDate}`;
        } else if (selectedMonth && selectedMonth !== 'all') {
          dateParam = `&month=${selectedMonth}`;
        }
         // Note: Backend /compare endpoint currently only supports 'month' or 'date', not 'start/end' range directly.
         // If a date range is selected, only 'month' or 'date' will be sent if available.
         // Full range filtering might require backend modification or frontend filtering.
      }


      // Use the correct backend endpoint and parameter names
      const url = `/comparison/compare?medicines=${medicineIds}&countries=${countryIds}${dateParam}`; // <-- THIS IS THE CORRECTED LINE

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
      // Convert current prices to USD
      await Promise.all(displayData.map(async (item) => {
        if (item.currency && item.currency.toUpperCase() !== 'USD') {
          try {
            const month = item.month ? new Date(item.month).toISOString().split('T')[0] : undefined;
            const usdPrice = await convertToUSD(item.price, item.currency, month);
            item.displayPrice = usdPrice;
            item.displayCurrency = 'USD';
          } catch (error) {
            console.error("Error converting current price to USD:", error);
            item.displayPrice = item.price;
            item.displayCurrency = item.currency || 'USD';
          }
        } else {
          item.displayPrice = item.price;
          item.displayCurrency = item.currency || 'USD';
        }
        
        // Convert historical trend data to USD as well
        if (item.trendData && item.trendData.length > 0) {
          item.displayTrendData = await Promise.all(item.trendData.map(async (trendItem: any) => {
            if (trendItem.currency && trendItem.currency.toUpperCase() !== 'USD') {
              try {
                const month = trendItem.month ? new Date(trendItem.month).toISOString().split('T')[0] : undefined;
                const usdPrice = await convertToUSD(trendItem.price, trendItem.currency, month);
                return { ...trendItem, price: usdPrice, currency: 'USD' };
              } catch (error) {
                console.error("Error converting trend price to USD:", error);
                return trendItem;
              }
            }
            return trendItem;
          }));
        } else {
          item.displayTrendData = [];
        }
      }));
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
    setSelectedMedicines(prevSelected => {
      const isSelected = prevSelected.includes(medicineId);
      
      if (isSelected) {
        // Deselect medicine
        const newSelectedMedicines = prevSelected.filter(id => id !== medicineId);
        // If no medicines are selected, clear selected countries as well
        if (newSelectedMedicines.length === 0) {
          setSelectedCountries([]);
        }
        return newSelectedMedicines;
      } else {
        // Select medicine (respect MAX_MEDICINES)
        if (prevSelected.length < MAX_MEDICINES) {
          return [...prevSelected, medicineId];
        } else {
          // If max is reached, replace the currently selected medicine
          return [medicineId];
        }
      }
    });
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
    setSelectedMedicines([]); // Clear selection
    // If no medicines are selected (which should be the case here), clear selected countries
    setSelectedCountries([]);
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
    
    // Group trend data by country and then medicine
    const trendDataGrouped = processedData.reduce((acc, item) => {
      // Use displayTrendData which contains converted prices
      if (!item.displayTrendData || item.displayTrendData.length === 0) return acc; // Skip if no trend data

      if (!acc[item.country]) {
        acc[item.country] = {};
      }
      
      if (!acc[item.country][item.medicine_id]) {
         acc[item.country][item.medicine_id] = {
            countryName: item.country,
            medicineName: item.medicine,
            data: []
         };
      }

      // Add historical price points from displayTrendData
      item.displayTrendData.forEach(trendItem => {
         acc[item.country][item.medicine_id].data.push({
            month: trendItem.month,
            price: trendItem.price, // Use converted price
            currency: trendItem.currency // Use converted currency (should be USD)
         });
      });
      
      return acc;
    }, {});

    // Convert to a flat array of series for the chart, sorting data points by month
    const chartSeries = Object.values(trendDataGrouped).flatMap(countryData => 
        Object.values(countryData).map(medicineSeries => ({
            ...medicineSeries,
            name: medicineSeries.countryName, // Only show country name in legend
            data: medicineSeries.data.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
        }))
    );

    // Filter out series with less than 2 data points (no trend possible)
    return chartSeries.filter(series => series.data.length >= 2);
  };
  
  // Combined loading state
  const isLoading = loadingMedicines || loadingAvailableCountries || loadingComparison;

  // Enhanced custom tooltip for charts with safety checks
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // The label for the trend chart is the date string
      const dateString = label;
      
      // Format the date string into a more readable format (e.g., "Month Year")
      let formattedDate = dateString;
      try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) { // Check if date is valid
          const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };
          formattedDate = date.toLocaleDateString('en-US', options); // Specify en-US locale
          
          // Capitalize the first letter of the formatted date
          if (formattedDate.length > 0) {
            formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
          }
        }
      } catch (error) {
        console.error("Error formatting date for tooltip:", error);
        // Fallback to original string if formatting fails
      }

      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 animate-fade-in">
          <p className="font-medium text-foreground">{formattedDate}</p>
          <div className="space-y-1 mt-1">
            {payload.map((data: any, index: number) => {
              const value = data.value;
              const currency = data.payload?.currency || 'USD';
              const formattedValue = typeof value === 'number' 
                ? formatCurrencyWithSymbol(value, currency)
                : 'N/A';
              
              // For trend chart, use the series name directly as it's now just the country name
              const displayLabel = data.name || 'Unknown Country';
              
              const isCheapest = cheapest && cheapest.country === displayLabel;

              return (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: data.color || data.stroke || COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-foreground">{displayLabel}:</span>
                  <span className="text-sm text-muted-foreground">{formattedValue}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Get the list of medicines to show based on country selection
  const getMedicinesToShow = () => {
    return medicines || [];
  };

  // Get filtered medicines based on search
  const getFilteredMedicines = () => {
    if (!medicines) return [];
    if (!medicineSearch.trim()) return medicines;
    
    const searchLower = medicineSearch.toLowerCase();
    return medicines.filter(medicine => 
      medicine.name.toLowerCase().includes(searchLower) ||
      medicine.dosage.toLowerCase().includes(searchLower)
    );
  };

  return (
    <div className="w-full max-w-screen-xl mx-auto p-4 md:p-6 space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Medicine Price Comparison
          </h1>
          <p className="text-lg text-muted-foreground">
            Compare prices across countries and find the best deals
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
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
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100/50 dark:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-800">
                  <BarChart2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Select Medicine</CardTitle>
                  <CardDescription>
                    Choose one medicine to compare
                    {selectedCountries.length > 0 && " (filtered by selected countries)"}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-sm font-medium px-3 py-1">
                {selectedMedicines.length}/1
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {/* Selected medicines with remove buttons */}
            {selectedMedicines.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Selected:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedMedicines.map(medicineId => {
                    const medicine = getMedicinesToShow().find(m => m.id === medicineId);
                    return (
                      <Badge key={medicineId} variant="secondary" className="gap-1 pr-1">
                        {medicine?.name}
                        <Button
                          variant="ghost"
                          size="sm" 
                          className="h-4 w-4 p-0 rounded-sm hover:bg-destructive hover:text-destructive-foreground"
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
            
            {/* Add search input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search medicines..."
                value={medicineSearch}
                onChange={(e) => setMedicineSearch(e.target.value)}
                className="pl-9 pr-3 py-2"
              />
            </div>
            
            {/* Scrollable list of medicines */}
            <ScrollArea className="flex-1 overflow-y-auto min-h-0">
              {loadingMedicines ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid gap-2 pr-4">
                  {getFilteredMedicines().map(medicine => {
                    const isSelected = selectedMedicines.includes(medicine.id);
                    const isDisabled = !isSelected && selectedMedicines.length >= MAX_MEDICINES;
                    
                    return (
                      <Button
                        key={medicine.id}
                        variant="ghost"
                        onClick={() => handleMedicineToggle(medicine.id)}
                        className={cn(
                          "justify-start text-left h-auto p-3 transition-colors",
                          "hover:bg-muted", // Use muted background on hover
                          isSelected 
                            ? "bg-primary/10 text-primary-foreground hover:bg-primary/20" // Style for selected item
                            : "",
                          isDisabled && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={isDisabled}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            isSelected 
                              ? "bg-primary" // Primary color for selected dot
                              : "bg-muted-foreground" // Muted for unselected dot
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className={cn("font-medium truncate", isSelected && "text-primary")}>{medicine.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {medicine.dosage}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="text-primary shrink-0">
                              <Badge variant="secondary" className="bg-primary/20 text-primary px-2 py-0.5 font-normal">Selected</Badge>
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

        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100/50 dark:bg-green-900/50 rounded-lg border border-green-200 dark:border-green-800">
                  <CircleDollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Select Countries</CardTitle>
                  <CardDescription>
                    Choose countries to compare prices
                  </CardDescription>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-sm px-3 py-1 h-auto"
                onClick={() => {
                  if (selectedCountries.length === availableCountries?.length && selectedCountries.length > 0) {
                    setSelectedCountries([]);
                  } else {
                    availableCountries?.length > 0 && setSelectedCountries(availableCountries.map(c => c.id));
                  }
                }}
                disabled={loadingAvailableCountries || !availableCountries?.length}
              >
                {selectedCountries.length === availableCountries?.length && selectedCountries.length > 0 ? "Unselect All" : "Select All"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0 flex flex-col">
            {/* Selected countries with remove buttons */}
            {selectedCountries.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Selected:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCountries.map(countryId => {
                    const country = availableCountries?.find(c => c.id === countryId);
                    return (
                      <Badge key={countryId} variant="secondary" className="gap-1 pr-1">
                        {country?.name} ({country?.currency})
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 rounded-sm hover:bg-destructive hover:text-destructive-foreground"
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

            <ScrollArea className="flex-1 overflow-y-auto min-h-0">
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
                          variant="ghost"
                          onClick={() => handleCountryToggle(country.id)}
                          className={cn(
                            "justify-start text-left h-auto p-3 transition-colors",
                            "hover:bg-muted", // Use muted background on hover
                            selectedCountries.includes(country.id) 
                              ? "bg-green-100/50 dark:bg-green-900/50 text-green-800 dark:text-green-200 hover:bg-green-100/70 dark:hover:bg-green-900/70" // Style for selected item
                              : ""
                          )}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className={cn(
                              "w-2.5 h-2.5 rounded-full",
                              selectedCountries.includes(country.id) 
                                ? "bg-green-600 dark:bg-green-400" // Green color for selected dot
                                : "bg-muted-foreground" // Muted for unselected dot
                            )} />
                            <div className="flex-1 text-left">
                              <div className={cn("font-medium", selectedCountries.includes(country.id) && "text-foreground")}>{country.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Currency: {country.currency}
                              </div>
                            </div>
                            {selectedCountries.includes(country.id) && (
                               <div className="text-green-600 dark:text-green-400 shrink-0">
                                <Badge variant="secondary" className="bg-green-100/20 text-green-800 dark:text-green-200 px-2 py-0.5 font-normal">Selected</Badge>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border border-blue-200 dark:border-blue-800 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Countries
                  </p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {selectedCountries.length}
                  </p>
                </div>
                <div className="p-2 bg-blue-200/50 dark:bg-blue-800/50 rounded-lg">
                  <BarChart2 className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border border-green-200 dark:border-green-800 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Cheapest Option
                  </p>
                  <p className="text-lg font-bold text-green-900 dark:text-green-100 truncate">
                    {cheapest ? cheapest.country : "N/A"}
                  </p>
                  <p className="text-xs text-green-800 dark:text-green-200">
                    {cheapest 
                      ? formatCurrencyWithSymbol(cheapest.displayPrice, cheapest.displayCurrency) 
                      : "No data"}
                  </p>
                </div>
                <div className="flex items-center gap-1 p-2 bg-green-200/50 dark:bg-green-800/50 rounded-lg">
                  <Crown className="h-5 w-5 text-green-700 dark:text-green-300" />
                  <TrendingDown className="h-4 w-4 text-green-700 dark:text-green-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border border-red-200 dark:border-red-800 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    Most Expensive
                  </p>
                  <p className="text-lg font-bold text-red-900 dark:text-red-100 truncate">
                    {mostExpensive ? mostExpensive.country : "N/A"}
                  </p>
                  <p className="text-xs text-red-800 dark:text-red-200">
                    {mostExpensive 
                      ? formatCurrencyWithSymbol(mostExpensive.displayPrice, mostExpensive.displayCurrency) 
                      : "No data"}
                  </p>
                </div>
                <div className="p-2 bg-red-200/50 dark:bg-red-800/50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-red-700 dark:text-red-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border border-purple-200 dark:border-purple-800 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Potential Savings
                  </p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {calculateSavings()}%
                  </p>
                  <p className="text-xs text-purple-800 dark:text-purple-200">
                    vs highest price
                  </p>
                </div>
                <div className="p-2 bg-purple-200/50 dark:bg-purple-800/50 rounded-lg">
                  <CircleDollarSign className="h-6 w-6 text-purple-700 dark:text-purple-300" />
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
                    {selectedMedicines.length === 1 ? "Medicine" : "No Medicine"} Across Countries
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
                          margin={{ top: 20, right: 30, left: 20, bottom: 90 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
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
                                <Cell
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
                      <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="month" 
                          type="category" 
                          allowDuplicatedCategory={false}
                          tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                        />
                        <YAxis 
                          label={{ 
                            value: `Price (${getFormattedChartData()[0]?.currency || 'USD'})`, 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { textAnchor: 'middle', fill: "hsl(var(--foreground))" }
                          }}
                          tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
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


