import React from "react";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { mockCountries } from "@/lib/mockData";
import { ScrollArea } from "@/components/ui/scroll-area";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export const Stats = () => {
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
            <p>Loading statistics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Calculate global statistics
  const totalSpending = countries?.reduce((acc, country) => {
    const spending = parseFloat(country.totalExpensesUSD.replace(/[^0-9.-]+/g, ""));
    return acc + spending;
  }, 0);

  const highestSpendingCountry = countries?.reduce((max, country) => {
    const spending = parseFloat(country.totalExpensesUSD.replace(/[^0-9.-]+/g, ""));
    const maxSpending = parseFloat(max.totalExpensesUSD.replace(/[^0-9.-]+/g, ""));
    return spending > maxSpending ? country : max;
  });

  const lowestSpendingCountry = countries?.reduce((min, country) => {
    const spending = parseFloat(country.totalExpensesUSD.replace(/[^0-9.-]+/g, ""));
    const minSpending = parseFloat(min.totalExpensesUSD.replace(/[^0-9.-]+/g, ""));
    return spending < minSpending ? country : min;
  });

  const highestGDPSpendingCountry = countries?.reduce((max, country) => {
    return country.marketInsights.healthcareSpendingGDP > max.marketInsights.healthcareSpendingGDP
      ? country
      : max;
  });

  return (
    <Layout>
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
          <h2 className="text-3xl font-bold tracking-tight">Global Statistics</h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Global Spending</CardTitle>
                <CardDescription>Annual medicine expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${totalSpending?.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Highest Spending Country</CardTitle>
                <CardDescription>By total expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{highestSpendingCountry?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {highestSpendingCountry?.totalExpensesUSD}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lowest Spending Country</CardTitle>
                <CardDescription>By total expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{lowestSpendingCountry?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {lowestSpendingCountry?.totalExpensesUSD}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Highest GDP Spending</CardTitle>
                <CardDescription>Healthcare spending as % of GDP</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{highestGDPSpendingCountry?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {highestGDPSpendingCountry?.marketInsights.healthcareSpendingGDP}% of GDP
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Total Medicine Purchases</CardTitle>
                <CardDescription>By country</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={countries?.map((country) => ({
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
                <CardTitle>Average Medicine Prices</CardTitle>
                <CardDescription>By country</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={countries?.map((country) => ({
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

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Price Inflation</CardTitle>
                <CardDescription>Year-over-year comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={countries?.map((country) => ({
                        name: country.name,
                        inflation: country.priceInflation,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="inflation" fill="#FF8042" name="Price Inflation %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Healthcare Spending</CardTitle>
                <CardDescription>As percentage of GDP</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={countries?.map((country) => ({
                          name: country.name,
                          value: country.marketInsights.healthcareSpendingGDP,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {countries?.map((_, index) => (
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
        </div>
      </ScrollArea>
    </Layout>
  );
}; 