import React from "react";
import { useParams } from "react-router-dom";
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
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { mockCountries } from "@/lib/mockData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, ShoppingCart, Users } from "lucide-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export const CountryStats = () => {
  const { countryId } = useParams();
  const { data: countries, isLoading } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      return mockCountries;
    },
  });

  const country = countries?.find((c) => c.id === countryId);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-center h-64">
            <p>Loading country statistics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!country) {
    return (
      <Layout>
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-center h-64">
            <p>Country not found</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">{country.name} Statistics</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{country.totalExpensesUSD}</div>
                <p className="text-xs text-muted-foreground">
                  {country.totalExpenses} in local currency
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Per Capita Expenses</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{country.perCapitaExpensesUSD}</div>
                <p className="text-xs text-muted-foreground">
                  {country.perCapitaExpenses} per person
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Price Inflation</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{country.priceInflation}%</div>
                <p className="text-xs text-muted-foreground">
                  Year-over-year change
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Medicines</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{country.total_medicines.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Available in market
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Price Trends</CardTitle>
                <CardDescription>Historical price changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={country.priceTrends}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#8884d8"
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                        name="Average Price"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Medicine Distribution</CardTitle>
                <CardDescription>By category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={country.medicineDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {country.medicineDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Seasonal Purchase Patterns</CardTitle>
              <CardDescription>Monthly medicine purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={country.seasonalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="purchases"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Purchases"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Medicines</CardTitle>
                <CardDescription>Most purchased medications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={country.topMedicines}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="quantity" fill="#8884d8" name="Quantity Sold" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Insights</CardTitle>
                <CardDescription>Key market indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Pharmacies</p>
                      <p className="text-2xl font-bold">
                        {country.marketInsights.totalPharmacies.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Pharmacy Revenue</p>
                      <p className="text-2xl font-bold">
                        {country.marketInsights.averagePharmacyRevenue}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Healthcare Spending</p>
                      <p className="text-2xl font-bold">
                        {country.marketInsights.healthcareSpendingGDP}% of GDP
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Market Growth</p>
                      <p className="text-2xl font-bold">
                        {country.marketInsights.marketGrowth}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </Layout>
  );
}; 