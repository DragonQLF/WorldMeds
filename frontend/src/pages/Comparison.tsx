import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { mockCountries } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InfoIcon } from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export const Comparison = () => {
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["BR", "AR"]);
  const [selectedMedicine, setSelectedMedicine] = useState<string>("");
  const navigate = useNavigate();

  const { data: countries, isLoading } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      return mockCountries;
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-center h-64">
            <p>Loading comparison data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const selectedCountryData = countries?.filter((country) =>
    selectedCountries.includes(country.id)
  );

  const handleCountryChange = (value: string, index: number) => {
    const newSelectedCountries = [...selectedCountries];
    newSelectedCountries[index] = value;
    setSelectedCountries(newSelectedCountries);
  };

  const handleViewDetails = (countryId: string) => {
    navigate(`/country/${countryId}/stats`);
  };

  return (
    <Layout>
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Country Comparison</h2>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Left Column - First Country */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select First Country</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedCountries[0]}
                    onValueChange={(value) => handleCountryChange(value, 0)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries?.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    className="w-full mt-4"
                    onClick={() => handleViewDetails(selectedCountries[0])}
                  >
                    View Detailed Statistics
                  </Button>
                </CardContent>
              </Card>

              {selectedCountryData?.[0] && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Healthcare Spending (% of GDP)</p>
                      <p className="text-2xl font-bold">{selectedCountryData[0].marketInsights.healthcareSpendingGDP}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Most Used Medicine</p>
                      <p className="text-2xl font-bold">{selectedCountryData[0].mostBoughtMedicine}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Most Expensive Medicine</p>
                      <p className="text-2xl font-bold">{selectedCountryData[0].marketInsights.mostExpensiveMedicine}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Second Country */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Second Country</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedCountries[1]}
                    onValueChange={(value) => handleCountryChange(value, 1)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries?.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    className="w-full mt-4"
                    onClick={() => handleViewDetails(selectedCountries[1])}
                  >
                    View Detailed Statistics
                  </Button>
                </CardContent>
              </Card>

              {selectedCountryData?.[1] && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Healthcare Spending (% of GDP)</p>
                      <p className="text-2xl font-bold">{selectedCountryData[1].marketInsights.healthcareSpendingGDP}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Most Used Medicine</p>
                      <p className="text-2xl font-bold">{selectedCountryData[1].mostBoughtMedicine}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Most Expensive Medicine</p>
                      <p className="text-2xl font-bold">{selectedCountryData[1].marketInsights.mostExpensiveMedicine}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Medicine-specific Comparison */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Medicine-specific Comparison</CardTitle>
                  <CardDescription>Compare specific medicine prices between countries</CardDescription>
                </div>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select a medicine to compare its price trends across selected countries. This helps identify price variations and historical changes for specific medications.</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select
                  value={selectedMedicine}
                  onValueChange={setSelectedMedicine}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select medicine to compare" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCountryData?.[0]?.topMedicines.map((medicine) => (
                      <SelectItem key={medicine.name} value={medicine.name}>
                        {medicine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedMedicine && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          {selectedCountryData?.map((country, index) => (
                            <Line
                              key={country.id}
                              type="monotone"
                              data={country.priceTrends.map(trend => ({
                                year: trend.year,
                                price: trend.price * (country.topMedicines.find(m => m.name === selectedMedicine)?.price || 0) / country.avg_price
                              }))}
                              dataKey="price"
                              name={`${country.name} - ${selectedMedicine}`}
                              stroke={COLORS[index % COLORS.length]}
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={selectedCountryData?.map((country) => ({
                            name: country.name,
                            price: country.topMedicines.find(m => m.name === selectedMedicine)?.price || 0,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="price" fill="#FF8042" name={`${selectedMedicine} Current Price`} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comparison Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Total Medicine Purchases</CardTitle>
                    <CardDescription>Comparison of total medicine purchases</CardDescription>
                  </div>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Shows the total number of medicines available in each country's market, indicating market size and accessibility.</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={selectedCountryData?.map((country) => ({
                        name: country.name,
                        purchases: country.total_medicines,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="purchases" fill="#8884d8" name="Total Purchases" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Average Medicine Prices</CardTitle>
                    <CardDescription>Comparison of average medicine prices</CardDescription>
                  </div>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Displays the average price of medicines in each country, helping identify cost differences and affordability.</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={selectedCountryData?.map((country) => ({
                        name: country.name,
                        price: country.avg_price,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="price" fill="#82ca9d" name="Average Price" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Price Inflation Trends</CardTitle>
                  <CardDescription>Historical price inflation comparison</CardDescription>
                </div>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Shows the historical trend of medicine prices over the past 5 years, helping identify long-term price changes and inflation patterns.</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {selectedCountryData?.map((country, index) => (
                      <Line
                        key={country.id}
                        type="monotone"
                        data={country.priceTrends}
                        dataKey="price"
                        name={country.name}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </Layout>
  );
}; 