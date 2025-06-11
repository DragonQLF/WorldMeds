import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Pill, Globe, TrendingUp, DollarSign, Calendar, Users, Trophy, TrendingDown, LineChart } from "lucide-react";
import { api } from "@/lib/api";
import { useMapContext } from "@/contexts/MapContext";
import { cn } from "@/lib/utils";
import { Layout } from "@/components/layout/Layout";
import { MedicineStatsChart } from "@/components/stats/MedicineStatsChart";
import { PriceComparisonTable } from "@/components/stats/PriceComparisonTable";
import { TrendAnalysisChart } from "@/components/stats/TrendAnalysisChart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CountryPriceChart } from "@/components/stats/CountryPriceChart";
import { getDateParam } from "@/utils/dateUtils";
import { format } from "date-fns";

interface StatsData {
  totalMedicines: number;
  totalCountries: number;
  totalTransactions: number;
  averagePrice: number;
  lowestPriceCountry: {
    country: string;
    averagePrice: number;
  };
  highestPriceCountry: {
    country: string;
    averagePrice: number;
  };
  mostPurchasedMedicine: {
    medicine: string;
    totalQuantity: number;
  };
  medicinesByCountry: Array<{
    country: string;
    medicineCount: number;
    averagePrice: number;
  }>;
  pricesByMedicine: Array<{
    medicine: string;
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    countryCount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    averagePrice: number;
    totalTransactions: number;
  }>;
}

interface GlobalTrendData {
  month: string;
  averagePrice: number;
  totalTransactions: number;
}

const Stats = () => {
  const { darkMode, selectedDate, dateRange, selectedMonth, useTimeFiltering } = useMapContext();
  const [selectedTab, setSelectedTab] = useState("overview");

  // Fetch general statistics with date parameters
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['stats', 'general', selectedDate, dateRange, selectedMonth, useTimeFiltering],
    queryFn: async () => {
      try {
        console.log('Fetching general statistics...');
        const dateParam = getDateParam(selectedDate, dateRange, selectedMonth);
        const response = await api.get(`/stats/general${dateParam}`);
        return response.data as StatsData;
      } catch (error) {
        console.error('Error fetching stats:', error);
        throw error;
      }
    }
  });

  // Fetch global trends
  const { data: globalTrends, isLoading: isLoadingTrends } = useQuery({
    queryKey: ['stats', 'global-trends'],
    queryFn: async () => {
      try {
        console.log('Fetching global trends...');
        const response = await api.get('/stats/global-trends');
        return response.data as GlobalTrendData[];
      } catch (error) {
        console.error('Error fetching global trends:', error);
        throw error;
      }
    }
  });

  if (isLoading) {
    return (
      <Layout>
        <div className={cn(
          "min-h-screen p-8",
          darkMode ? "bg-gray-900" : "bg-gray-50"
        )}>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!statsData) {
    return (
      <Layout>
        <div className={cn(
          "min-h-screen p-8",
          darkMode ? "bg-gray-900 text-white" : "bg-gray-50"
        )}>
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Failed to load statistics. Please try again later.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ScrollArea className="h-screen">
        <div className={cn(
          "min-h-screen p-8",
          darkMode ? "bg-gray-900 text-white" : "bg-gray-50"
        )}>
          <div className="max-w-7xl mx-auto">
            {/* Key Insights - Larger cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              <Card className={cn(
                "bg-gradient-to-br from-green-50 to-green-100 border-green-200 p-6",
                darkMode ? "from-green-900/20 to-green-800/20 border-green-700" : ""
              )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-lg font-medium text-green-700 dark:text-green-300">
                    Most Economic Country
                  </CardTitle>
                  <TrendingDown className="h-6 w-6 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-800 dark:text-green-200 mb-2">
                    {statsData.lowestPriceCountry.country}
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Average price: ${statsData.lowestPriceCountry.averagePrice.toFixed(2)} USD
                  </p>
                </CardContent>
              </Card>

              <Card className={cn(
                "bg-gradient-to-br from-red-50 to-red-100 border-red-200 p-6",
                darkMode ? "from-red-900/20 to-red-800/20 border-red-700" : ""
              )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-lg font-medium text-red-700 dark:text-red-300">
                    Most Expensive Country
                  </CardTitle>
                  <TrendingUp className="h-6 w-6 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-800 dark:text-red-200 mb-2">
                    {statsData.highestPriceCountry.country}
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Average price: ${statsData.highestPriceCountry.averagePrice.toFixed(2)} USD
                  </p>
                </CardContent>
              </Card>

              <Card className={cn(
                "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 p-6",
                darkMode ? "from-purple-900/20 to-purple-800/20 border-purple-700" : ""
              )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-lg font-medium text-purple-700 dark:text-purple-300">
                    Most Purchased Medicine
                  </CardTitle>
                  <Trophy className="h-6 w-6 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-800 dark:text-purple-200 mb-2">
                    {statsData.mostPurchasedMedicine.medicine}
                  </div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    {statsData.mostPurchasedMedicine.totalQuantity} units sold
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Overview Cards - Larger */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
              <Card className={cn(
                "hover:shadow-lg transition-all duration-200 transform hover:scale-105 p-6",
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
              )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-lg font-medium">Total Medicines</CardTitle>
                  <Pill className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-3">{statsData.totalMedicines}</div>
                  <Badge variant="secondary" className="text-sm">
                    In database
                  </Badge>
                </CardContent>
              </Card>

              <Card className={cn(
                "hover:shadow-lg transition-all duration-200 transform hover:scale-105 p-6",
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
              )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-lg font-medium">Countries</CardTitle>
                  <Globe className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-3">{statsData.totalCountries}</div>
                  <Badge variant="secondary" className="text-sm">
                    With pricing data
                  </Badge>
                </CardContent>
              </Card>

              <Card className={cn(
                "hover:shadow-lg transition-all duration-200 transform hover:scale-105 p-6",
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
              )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-lg font-medium">Total Records</CardTitle>
                  <Users className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-3">{statsData.totalTransactions}</div>
                  <Badge variant="secondary" className="text-sm">
                    Price records
                  </Badge>
                </CardContent>
              </Card>

              <Card className={cn(
                "hover:shadow-lg transition-all duration-200 transform hover:scale-105 p-6",
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
              )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-lg font-medium">Global Average Price</CardTitle>
                  <DollarSign className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-3">${statsData.averagePrice.toFixed(2)}</div>
                  <Badge variant="secondary" className="text-sm">
                    USD
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analysis */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="medicines">Medicines</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <CountryPriceChart data={statsData.medicinesByCountry} darkMode={darkMode} />
                </div>
              </TabsContent>

              <TabsContent value="medicines" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <MedicineStatsChart data={statsData.pricesByMedicine} darkMode={darkMode} />
                  <PriceComparisonTable data={statsData.pricesByMedicine} darkMode={darkMode} />
                </div>
              </TabsContent>

              <TabsContent value="trends" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Global Average Price Trend */}
                  <Card className={cn(
                    "bg-card dark:bg-card",
                    darkMode ? "border-gray-700" : "border-gray-200"
                  )}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LineChart className="h-5 w-5" />
                        Global Average Price Trend
                      </CardTitle>
                      <CardDescription>
                        Monthly trend of global average medicine prices over the last 24 months
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingTrends ? (
                        <div className="flex justify-center items-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                      ) : globalTrends && globalTrends.length > 0 ? (
                        <TrendAnalysisChart 
                          data={globalTrends.map(trend => ({
                            month: format(new Date(trend.month), 'MMM yyyy'),
                            averagePrice: trend.averagePrice,
                            totalTransactions: trend.totalTransactions
                          }))} 
                          darkMode={darkMode}
                          showTransactions={true}
                        />
                      ) : (
                        <div className="flex justify-center items-center h-64 text-muted-foreground">
                          No trend data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ScrollArea>
    </Layout>
  );
};

export default Stats; 