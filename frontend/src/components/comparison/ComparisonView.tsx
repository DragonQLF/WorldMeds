
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, formatCurrencyWithSymbol, convertToUSD } from "@/lib/api";
import { 
  BarChart2, 
  ChevronDown, 
  CircleDollarSign,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
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

const MAX_MEDICINES = 5;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface ComparisonViewProps {
  onClose?: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ onClose }) => {
  const { toast } = useToast();
  
  // State for selected items and UI controls - removed saved settings
  const [selectedMedicines, setSelectedMedicines] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "chart">("chart");
  const [showLocalCurrency, setShowLocalCurrency] = useState<boolean>(false);
  const [comparisonMode, setComparisonMode] = useState<"medicine" | "country">("medicine");

  // Fetch medicines list from the API
  const { data: medicines, isLoading: loadingMedicines } = useQuery({
    queryKey: ['medicines'],
    queryFn: async () => {
      const response = await api.get('/comparison/medicines');
      return response.data;
    }
  });

  // Fetch all countries list from the API
  const { data: allCountries, isLoading: loadingAllCountries } = useQuery({
    queryKey: ['all-countries'],
    queryFn: async () => {
      const response = await api.get('/comparison/countries');
      return response.data;
    }
  });

  // Fetch available countries based on selected medicines
  const { data: availableCountries, isLoading: loadingAvailableCountries } = useQuery({
    queryKey: ['available-countries', selectedMedicines],
    queryFn: async () => {
      if (!selectedMedicines.length) {
        return [];
      }
      
      const medicineIds = selectedMedicines.join(',');
      const response = await api.get(`/comparison/available-countries?medicineIds=${medicineIds}`);
      return response.data;
    },
    enabled: selectedMedicines.length > 0
  });

  // Initialize comparison data query
  const { data: comparisonData, isLoading: loadingComparison } = useQuery({
    queryKey: ['comparison-data', selectedMedicines, selectedCountries, comparisonMode],
    queryFn: async () => {
      if ((!selectedMedicines.length && comparisonMode === "medicine") || 
          (!selectedCountries.length)) {
        return [];
      }
      
      // Build query params
      const medicineIds = selectedMedicines.join(',');
      const countryIds = selectedCountries.join(',');
      const url = `/comparison/data?medicineIds=${medicineIds}&countries=${countryIds}&mode=${comparisonMode}`;
      
      const response = await api.get(url);
      return response.data;
    },
    enabled: (selectedMedicines.length > 0 || comparisonMode === "country") && selectedCountries.length > 0
  });

  // Formatting and preparing data for display
  const prepareDisplayData = async () => {
    if (!comparisonData || comparisonData.length === 0) return [];
    
    const displayData = [...comparisonData];
    
    // For multiple countries, always use USD
    // For single country, honor the showLocalCurrency setting
    const shouldConvertToUSD = comparisonMode === "medicine" && selectedCountries.length > 1 
      ? true 
      : !showLocalCurrency;
    
    if (shouldConvertToUSD && displayData.length > 0) {
      for (let i = 0; i < displayData.length; i++) {
        const item = displayData[i];
        if (item.currency.toUpperCase() !== 'USD') {
          try {
            const usdPrice = await convertToUSD(item.price, item.currency);
            item.displayPrice = usdPrice;
            item.displayCurrency = 'USD';
          } catch (error) {
            console.error("Error converting to USD:", error);
            item.displayPrice = item.price;
            item.displayCurrency = item.currency;
          }
        } else {
          item.displayPrice = item.price;
          item.displayCurrency = item.currency;
        }
      }
    } else {
      // Show in local currency
      displayData.forEach(item => {
        item.displayPrice = item.price;
        item.displayCurrency = item.currency;
      });
    }
    
    return displayData;
  };

  // Use React state to store processed display data
  const [processedData, setProcessedData] = useState<any[]>([]);
  
  // Update processed data whenever raw data or currency preference changes
  useEffect(() => {
    if (comparisonData && comparisonData.length > 0) {
      prepareDisplayData().then(data => {
        setProcessedData(data);
      });
    } else {
      setProcessedData([]);
    }
  }, [comparisonData, showLocalCurrency, comparisonMode, selectedCountries]);
  
  // Disable currency toggle for multiple countries
  useEffect(() => {
    // Force USD for multiple countries comparison
    if (comparisonMode === "medicine" && selectedCountries.length > 1) {
      setShowLocalCurrency(false);
    }
  }, [selectedCountries, comparisonMode]);
  
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

  // Handle medicine selection (with limit)
  const handleMedicineToggle = (medicineId: string) => {
    if (selectedMedicines.includes(medicineId)) {
      setSelectedMedicines(selectedMedicines.filter(id => id !== medicineId));
    } else if (selectedMedicines.length < MAX_MEDICINES) {
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

  // Switch comparison mode and reset selections if needed
  const handleModeChange = (mode: "medicine" | "country") => {
    if (mode !== comparisonMode) {
      setComparisonMode(mode);
      
      // Reset selections when changing modes
      if (mode === "country" && selectedCountries.length !== 1) {
        // For country mode, we need exactly one country selected
        setSelectedCountries(allCountries && allCountries.length > 0 ? [allCountries[0].id] : []);
      } else if (mode === "medicine" && selectedCountries.length === 0) {
        // For medicine mode, ensure we have at least one country
        setSelectedCountries(availableCountries && availableCountries.length > 0 ? [availableCountries[0].id] : []);
      }
    }
  };

  // Handle currency display toggle - only enabled for single country mode or country comparison
  const toggleCurrencyDisplay = () => {
    if (comparisonMode === "country" || selectedCountries.length === 1) {
      setShowLocalCurrency(!showLocalCurrency);
    }
  };

  // Check if currency toggle should be disabled
  const isCurrencyToggleDisabled = comparisonMode === "medicine" && selectedCountries.length > 1;

  // Format data for charts based on comparison mode
  const getFormattedChartData = () => {
    if (!processedData || processedData.length === 0) return [];
    
    if (comparisonMode === "medicine") {
      // For medicine comparison, group by country
      return processedData.map(item => ({
        name: item.country,
        price: item.displayPrice,
        currency: item.displayCurrency,
        priceFmt: formatCurrencyWithSymbol(item.displayPrice, item.displayCurrency),
        medicine: item.medicine || "Selected Medicine"
      }));
    } else {
      // For country comparison, group by medicine
      return processedData.map(item => ({
        name: item.medicine,
        price: item.displayPrice,
        currency: item.displayCurrency,
        priceFmt: formatCurrencyWithSymbol(item.displayPrice, item.displayCurrency),
        country: item.country || "Selected Country"
      }));
    }
  };

  // Format data for trend chart
  const getFormattedTrendData = () => {
    if (!processedData || processedData.length === 0) return [];
    
    // Return array with each country/medicine and their trend data
    return processedData.map(item => ({
      name: comparisonMode === "medicine" ? item.country : item.medicine,
      data: item.trendData || []
    }));
  };
  
  // Combined loading state
  const isLoading = loadingMedicines || loadingAllCountries || loadingAvailableCountries || loadingComparison;

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold">Medicine Price Comparison</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Mode:</span>
          <ToggleGroup type="single" value={comparisonMode} onValueChange={(value) => value && handleModeChange(value as "medicine" | "country")}>
            <ToggleGroupItem value="medicine" aria-label="Compare medicines across countries">
              Multiple Countries
            </ToggleGroupItem>
            <ToggleGroupItem value="country" aria-label="Compare medicines within a country">
              Single Country
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Medicines (Max {MAX_MEDICINES})</CardTitle>
            <CardDescription>
              {selectedMedicines.length}/{MAX_MEDICINES} selected
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[250px] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {loadingMedicines ? (
                <div className="col-span-2 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : medicines?.map(medicine => (
                <Button
                  key={medicine.id}
                  variant={selectedMedicines.includes(medicine.id) ? "default" : "outline"}
                  onClick={() => handleMedicineToggle(medicine.id)}
                  className="justify-start text-left overflow-hidden text-ellipsis"
                  disabled={!selectedMedicines.includes(medicine.id) && selectedMedicines.length >= MAX_MEDICINES}
                >
                  <div className="truncate">
                    {medicine.name}
                    <span className="text-xs block text-muted-foreground truncate">
                      {medicine.active_ingredient}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {comparisonMode === "medicine" ? "Select Countries" : "Select Country"}
              </CardTitle>
              <CardDescription>
                {comparisonMode === "medicine"
                  ? "Choose countries to compare"
                  : "Select a single country to compare medicines"}
              </CardDescription>
            </div>
            {comparisonMode === "medicine" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => availableCountries?.length > 0 && setSelectedCountries(availableCountries.map(c => c.id))}
                disabled={loadingAvailableCountries || !availableCountries?.length}
              >
                Select All
              </Button>
            )}
          </CardHeader>
          <CardContent className="max-h-[250px] overflow-y-auto">
            {(loadingAvailableCountries || (!availableCountries && selectedMedicines.length > 0)) ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {comparisonMode === "country" ? (
                  // In country mode, use Select to ensure only one country is chosen
                  <Select
                    value={selectedCountries[0] || ""}
                    onValueChange={(value) => setSelectedCountries([value])}
                    disabled={loadingAvailableCountries}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {(availableCountries || allCountries)?.map(country => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name} ({country.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  // In medicine mode, allow multiple countries
                  availableCountries?.length > 0 ? (
                    availableCountries.map(country => (
                      <Button
                        key={country.id}
                        variant={selectedCountries.includes(country.id) ? "default" : "outline"}
                        onClick={() => handleCountryToggle(country.id)}
                        className="justify-start"
                      >
                        {country.name} ({country.currency})
                      </Button>
                    ))
                  ) : (
                    <div className="col-span-2 text-center text-muted-foreground">
                      {selectedMedicines.length === 0 
                        ? "Select at least one medicine to see available countries" 
                        : "No countries have data for all the selected medicines"}
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : processedData.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {comparisonMode === "medicine" 
                    ? "Countries Compared" 
                    : "Medicines Compared"}
                </CardTitle>
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {comparisonMode === "medicine" ? selectedCountries.length : processedData.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {comparisonMode === "medicine" 
                    ? "Cheapest In" 
                    : "Cheapest Medicine"}
                </CardTitle>
                <ChevronDown className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {cheapest ? (comparisonMode === "medicine" ? cheapest.country : cheapest.medicine) : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {cheapest 
                    ? formatCurrencyWithSymbol(cheapest.displayPrice, cheapest.displayCurrency) 
                    : "No data available"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
                <CircleDollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{calculateSavings()}%</div>
                <p className="text-xs text-muted-foreground">
                  Between highest and lowest price
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-card border rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:px-6 border-b gap-4">
              <h2 className="font-semibold text-lg truncate max-w-full md:max-w-md">
                {comparisonMode === "medicine"
                  ? `${selectedMedicines.length} Medicine${selectedMedicines.length > 1 ? "s" : ""} Price Comparison`
                  : `${processedData.length} Medicines in ${processedData[0]?.country || "Selected Country"}`}
              </h2>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2" aria-label="Toggle currency display">
                  <span className={`text-sm ${isCurrencyToggleDisabled ? 'text-muted-foreground' : ''}`}>
                    {showLocalCurrency ? "Local Currency" : "USD"}
                  </span>
                  <Switch
                    id="currency-toggle"
                    checked={!showLocalCurrency}
                    onCheckedChange={toggleCurrencyDisplay}
                    disabled={isCurrencyToggleDisabled}
                  />
                  <span className={`text-sm ${isCurrencyToggleDisabled ? 'text-muted-foreground' : ''}`}>
                    {showLocalCurrency ? "USD" : "Local Currency"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant={viewMode === "chart" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("chart")}
                  >
                    Chart
                  </Button>
                  <Button 
                    variant={viewMode === "table" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setViewMode("table")}
                  >
                    Table
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6">
              <Tabs defaultValue="bar" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                  <TabsTrigger value="trend">Trend Lines</TabsTrigger>
                </TabsList>
                
                <TabsContent value="bar">
                  {viewMode === "chart" ? (
                    <div className="h-[400px] w-full overflow-x-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={getFormattedChartData()} 
                          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={70}
                            interval={0}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            label={{ 
                              value: 'Price', 
                              angle: -90, 
                              position: 'insideLeft' 
                            }} 
                          />
                          <Tooltip 
                            formatter={(value, name) => [
                              `${value} ${getFormattedChartData()[0]?.currency || 'USD'}`,
                              'Price'
                            ]}
                            labelFormatter={(label) => {
                              const item = getFormattedChartData().find(item => item.name === label);
                              return comparisonMode === "medicine" 
                                ? `${label} (${item?.medicine || "Selected Medicine"})`
                                : `${label} (${item?.country || "Selected Country"})`;
                            }}
                          />
                          <Legend />
                          <Bar 
                            dataKey="price" 
                            name="Price" 
                            fill="#8884d8"
                            isAnimationActive={false}
                            shape={(props: any) => {
                              const { x, y, width, height, index } = props;
                              const data = getFormattedChartData();
                              const isCheapest = cheapest && 
                                ((comparisonMode === "medicine" && data[index]?.name === cheapest.country) ||
                                (comparisonMode === "country" && data[index]?.name === cheapest.medicine));
                              
                              return (
                                <rect 
                                  x={x} 
                                  y={y} 
                                  width={width} 
                                  height={height} 
                                  fill={isCheapest ? "#00C49F" : "#8884d8"} 
                                  stroke={isCheapest ? "#004D40" : "none"}
                                  strokeWidth={isCheapest ? 1 : 0}
                                />
                              );
                            }}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              {comparisonMode === "medicine" ? "Country" : "Medicine"}
                            </TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Currency</TableHead>
                            <TableHead>Compared to Cheapest</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {processedData.map((item, index) => (
                            <TableRow 
                              key={index}
                              className={
                                cheapest && (
                                  (comparisonMode === "medicine" && item.country === cheapest.country) ||
                                  (comparisonMode === "country" && item.medicine === cheapest.medicine)
                                ) ? "bg-green-50 dark:bg-green-950/20" : ""
                              }
                            >
                              <TableCell className="font-medium">
                                {comparisonMode === "medicine" ? item.country : item.medicine}
                              </TableCell>
                              <TableCell>{item.displayPrice.toFixed(2)}</TableCell>
                              <TableCell>{item.displayCurrency}</TableCell>
                              <TableCell>
                                {cheapest && (
                                  (comparisonMode === "medicine" && item.country !== cheapest.country) ||
                                  (comparisonMode === "country" && item.medicine !== cheapest.medicine)
                                ) ? (
                                  <span className="text-red-500">
                                    +{((item.displayPrice - cheapest.displayPrice) / cheapest.displayPrice * 100).toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="text-green-500">Cheapest</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="trend">
                  <div className="h-[400px] w-full overflow-x-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          type="category" 
                          allowDuplicatedCategory={false} 
                        />
                        <YAxis 
                          label={{ 
                            value: 'Price', 
                            angle: -90, 
                            position: 'insideLeft' 
                          }} 
                        />
                        <Tooltip />
                        <Legend />
                        {getFormattedTrendData().map((series, index) => (
                          <Line 
                            key={series.name}
                            data={series.data} 
                            type="monotone" 
                            dataKey="price" 
                            name={series.name} 
                            stroke={COLORS[index % COLORS.length]} 
                            activeDot={{ r: 8 }}
                            isAnimationActive={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Data to Display</CardTitle>
            <CardDescription>
              {selectedMedicines.length === 0
                ? "Please select at least one medicine"
                : selectedCountries.length === 0
                ? "Please select at least one country"
                : "No data available for the selected combination"}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
};
