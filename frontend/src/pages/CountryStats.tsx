import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { useMapContext } from "@/contexts/MapContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CountryStats = () => {
  const { countryId } = useParams<{ countryId: string }>();
  const [countryData, setCountryData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<any[]>([]);
  const [availabilityData, setAvailabilityData] = useState<any[]>([]);
  const { darkMode } = useMapContext();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCountryData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch basic country information
        const countryResponse = await api.get(`/countries/${countryId}`);
        setCountryData(countryResponse.data);
        
        // Fetch historical price data
        const priceResponse = await api.get(`/countries/${countryId}/price-history`);
        const formattedPriceData = priceResponse.data.map((item: any) => ({
          ...item,
          date: format(parseISO(item.date), 'MMM yyyy'),
          averagePrice: parseFloat(item.averagePrice)
        }));
        setPriceData(formattedPriceData);
        
        // Fetch medicine availability data
        const availabilityResponse = await api.get(`/countries/${countryId}/medicine-availability`);
        setAvailabilityData(availabilityResponse.data);
        
      } catch (err: any) {
        console.error("Error fetching country stats:", err);
        setError(err.message || "Failed to load country statistics");
      } finally {
        setLoading(false);
      }
    };
    
    if (countryId) {
      fetchCountryData();
    }
  }, [countryId]);

  const handleExportData = () => {
    // Create CSV content
    const csvContent = [
      // CSV header
      ["Date", "Average Price (USD)", "Available Medicines"],
      // CSV data rows
      ...priceData.map(item => [
        item.date,
        item.averagePrice.toFixed(2),
        item.medicineCount || "N/A"
      ])
    ]
      .map(row => row.join(","))
      .join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${countryData?.name || "country"}_medicine_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[350px] w-full" />
            <Skeleton className="h-[350px] w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Error</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">{countryData?.name} Medicine Statistics</h1>
          </div>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>

        <Tabs defaultValue="prices" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="prices">Price Trends</TabsTrigger>
            <TabsTrigger value="availability">Medicine Availability</TabsTrigger>
            <TabsTrigger value="comparison">Global Comparison</TabsTrigger>
          </TabsList>
          
          <TabsContent value="prices">
            <Card>
              <CardHeader>
                <CardTitle>Medicine Price Trends</CardTitle>
                <CardDescription>
                  Average medicine prices in {countryData?.name} over time (USD)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={priceData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                      <XAxis 
                        dataKey="date" 
                        stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      />
                      <YAxis 
                        stroke={darkMode ? "#9ca3af" : "#6b7280"}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                          borderColor: darkMode ? "#374151" : "#e5e7eb",
                          color: darkMode ? "#f9fafb" : "#111827"
                        }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, "Average Price"]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="averagePrice"
                        name="Average Price"
                        stroke="#2563eb"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="availability">
            <Card>
              <CardHeader>
                <CardTitle>Medicine Availability</CardTitle>
                <CardDescription>
                  Number of medicines available in {countryData?.name} by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={availabilityData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                      <XAxis 
                        dataKey="category" 
                        stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      />
                      <YAxis 
                        stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                          borderColor: darkMode ? "#374151" : "#e5e7eb",
                          color: darkMode ? "#f9fafb" : "#111827"
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="count" 
                        name="Available Medicines" 
                        fill="#10b981" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="comparison">
            <Card>
              <CardHeader>
                <CardTitle>Global Price Comparison</CardTitle>
                <CardDescription>
                  How {countryData?.name}'s medicine prices compare to global averages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: "Antibiotics",
                          country: countryData?.antibioticPrice || 0,
                          global: countryData?.globalAntibioticPrice || 0
                        },
                        {
                          name: "Pain Relief",
                          country: countryData?.painReliefPrice || 0,
                          global: countryData?.globalPainReliefPrice || 0
                        },
                        {
                          name: "Chronic Disease",
                          country: countryData?.chronicDiseasePrice || 0,
                          global: countryData?.globalChronicDiseasePrice || 0
                        },
                        {
                          name: "Overall",
                          country: countryData?.averagePrice || 0,
                          global: countryData?.globalAveragePrice || 0
                        }
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                      <XAxis 
                        dataKey="name" 
                        stroke={darkMode ? "#9ca3af" : "#6b7280"}
                      />
                      <YAxis 
                        stroke={darkMode ? "#9ca3af" : "#6b7280"}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                          borderColor: darkMode ? "#374151" : "#e5e7eb",
                          color: darkMode ? "#f9fafb" : "#111827"
                        }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
                      />
                      <Legend />
                      <Bar 
                        dataKey="country" 
                        name={`${countryData?.name}`} 
                        fill="#3b82f6" 
                      />
                      <Bar 
                        dataKey="global" 
                        name="Global Average" 
                        fill="#ef4444" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CountryStats;
