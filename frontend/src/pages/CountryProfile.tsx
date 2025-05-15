import React, { lazy, Suspense, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Users, Calendar, PieChart, BarChart2, Building2, AlertTriangle, Info, Shield } from "lucide-react";
import { mockCountries } from "@/lib/mockData";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  Label,
} from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{data.name}</p>
        <p>{data.value}%</p>
        <p className="text-sm text-muted-foreground">{data.description}</p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{label}</p>
        <p>Purchases: {data.purchases}</p>
        <p className="text-sm text-muted-foreground">{data.trend}</p>
      </div>
    );
  }
  return null;
};

export const CountryProfile: React.FC = () => {
  const { countryId } = useParams();
  const navigate = useNavigate();

  const { data: countryData, isLoading } = useQuery({
    queryKey: ["countryProfile", countryId],
    queryFn: async () => {
      const country = mockCountries.find(c => c.id === countryId);
      if (!country) throw new Error("Country not found");
      return country;
    },
    enabled: !!countryId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p>Loading country profile...</p>
        </div>
      </div>
    );
  }

  if (!countryData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p>Country data not found</p>
        </div>
      </div>
    );
  }

  // Render price change indicator with fancy icons
  const renderPriceChange = (value: number) => {
    if (!value) return null;
    
    const isIncrease = value > 0;
    return (
      <div className={`flex items-center gap-1 ${isIncrease ? "text-red-500" : "text-emerald-500"}`}>
        {isIncrease ? (
          <TrendingUp className="h-4 w-4" />
        ) : (
          <TrendingDown className="h-4 w-4" />
        )}
        <span>{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Map
        </Button>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{countryData.name}</h1>
          <Button
            onClick={() => navigate(`/country/${countryId}/stats`)}
            className="flex items-center gap-2"
          >
            <BarChart2 className="h-4 w-4" />
            View Full Statistics
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countryData.totalExpenses}</div>
            <p className="text-xs text-muted-foreground">
              {countryData.totalExpensesUSD} USD
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Per Capita</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countryData.perCapitaExpenses}</div>
            <p className="text-xs text-muted-foreground">
              {countryData.perCapitaExpensesUSD} USD
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price Inflation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{Math.abs(countryData.priceInflation)}%</span>
              {renderPriceChange(countryData.priceInflation)}
            </div>
            <p className="text-xs text-muted-foreground">
              vs last year
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Bought</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countryData.mostBoughtMedicine}</div>
            <p className="text-xs text-muted-foreground">
              {countryData.mostBoughtQuantity} units
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Market Overview</CardTitle>
            <CardDescription>Key market indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>Total Pharmacies</span>
                </div>
                <span className="font-medium">{countryData.marketInsights.totalPharmacies.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Avg. Pharmacy Revenue</span>
                </div>
                <span className="font-medium">{countryData.marketInsights.averagePharmacyRevenue}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span>Most Expensive Medicine</span>
                </div>
                <span className="font-medium">{countryData.marketInsights.mostExpensiveMedicine}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span>Price Range</span>
                </div>
                <span className="font-medium">{countryData.marketInsights.priceRange}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span>Market Growth</span>
                </div>
                <span className="font-medium">{countryData.marketInsights.marketGrowth}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>Regulatory Status</span>
                </div>
                <span className="font-medium">{countryData.marketInsights.regulatoryStatus}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Medicines</CardTitle>
            <CardDescription>Most purchased medicines in {countryData.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {countryData.topMedicines.map((medicine: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{medicine.name}</p>
                    <p className="text-sm text-muted-foreground">{medicine.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{medicine.price}</p>
                    <p className="text-sm text-muted-foreground">{medicine.quantity} units</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Price Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="seasonality">Seasonality</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Analysis</CardTitle>
              <CardDescription>Key insights and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Price Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Average medicine prices have increased by {countryData.priceInflation}% compared to last year.
                      The most significant price changes were observed in the antibiotics category.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Market Trends</h3>
                    <p className="text-sm text-muted-foreground">
                      The market is growing at a rate of {countryData.marketInsights.marketGrowth}.
                      OTC medications continue to dominate the market, with painkillers being the most purchased category.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Price Trends Over Time</CardTitle>
              <CardDescription>Medicine price inflation by year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={countryData.priceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year">
                      <Label value="Year" position="bottom" />
                    </XAxis>
                    <YAxis>
                      <Label value="Price" angle={-90} position="left" />
                    </YAxis>
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="price"
                      name="Average Price"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Medicine Distribution</CardTitle>
              <CardDescription>Distribution by medicine type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={countryData.medicineDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {countryData.medicineDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomPieTooltip />} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seasonality">
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Trends</CardTitle>
              <CardDescription>Monthly purchase patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={countryData.seasonalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month">
                      <Label value="Month" position="bottom" />
                    </XAxis>
                    <YAxis>
                      <Label value="Purchases" angle={-90} position="left" />
                    </YAxis>
                    <RechartsTooltip content={<CustomBarTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="purchases"
                      name="Monthly Purchases"
                      fill="#8884d8"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default memo(CountryProfile);
