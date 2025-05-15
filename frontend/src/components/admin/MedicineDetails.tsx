import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, convertToUSD } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart4, ShoppingCart, Pill, Flag, Globe, DollarSign } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";

interface MedicineDetailsProps {
  medicineId: string;
}

interface Transaction {
  id: string;
  saleDate: string;
  quantity: number;
  price: number;
  countryName: string;
  countryId: string;
  pillsPerPackage: number;
  currency?: string;
}

interface Country {
  id: string;
  name: string;
  currency: string;
  lastPurchaseDate: string;
  lastPrice: number;
  lastQuantity: number;
  pillsPerPackage: number;
}

const MedicineDetails: React.FC<MedicineDetailsProps> = ({ medicineId }) => {
  const [showLocalCurrency, setShowLocalCurrency] = useState(false);
  const [convertedPrices, setConvertedPrices] = useState<Record<string, number>>({});

  const { data: medicine, isLoading: isMedicineLoading } = useQuery({
    queryKey: ["medicine", medicineId],
    queryFn: async () => {
      const response = await api.get(`/admin/medicines/${medicineId}`);
      return response.data;
    },
    enabled: !!medicineId,
  });

  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery({
    queryKey: ["medicine", medicineId, "transactions"],
    queryFn: async () => {
      const response = await api.get(`/admin/medicines/${medicineId}/transactions`);
      return response.data;
    },
    enabled: !!medicineId,
  });

  const { data: countries = [], isLoading: isCountriesLoading } = useQuery({
    queryKey: ["medicine", medicineId, "countries"],
    queryFn: async () => {
      const response = await api.get(`/admin/medicines/${medicineId}/countries`);
      return response.data;
    },
    enabled: !!medicineId,
  });

  // Convert prices when data loads or currency display setting changes
  useEffect(() => {
    const convertPrices = async () => {
      // Don't convert if showing in local currency
      if (showLocalCurrency || !transactions.length) {
        return;
      }
      
      const newPrices: Record<string, number> = {};
      
      // Convert transaction prices
      for (const transaction of transactions) {
        if (transaction.currency && transaction.currency !== 'USD') {
          try {
            const convertedPrice = await convertToUSD(transaction.price, transaction.currency);
            newPrices[`transaction-${transaction.id}`] = convertedPrice;
          } catch (error) {
            console.error(`Failed to convert price for transaction ${transaction.id}:`, error);
          }
        }
      }
      
      // Convert country prices
      for (const country of countries) {
        if (country.currency && country.currency !== 'USD') {
          try {
            const convertedPrice = await convertToUSD(country.lastPrice, country.currency);
            newPrices[`country-${country.id}`] = convertedPrice;
          } catch (error) {
            console.error(`Failed to convert price for country ${country.id}:`, error);
          }
        }
      }
      
      setConvertedPrices(newPrices);
    };
    
    convertPrices();
  }, [transactions, countries, showLocalCurrency]);

  // Display price with correct currency
  const displayPrice = (price: number, entityId: string, entityType: 'transaction' | 'country', currency?: string) => {
    const key = `${entityType}-${entityId}`;
    
    // Use local currency if showLocalCurrency is true
    if (showLocalCurrency) {
      return formatPrice(price, currency || 'USD');
    }
    
    // Otherwise use USD (either original or converted)
    const finalPrice = convertedPrices[key] || price;
    return formatPrice(finalPrice, 'USD');
  };

  if (isMedicineLoading) {
    return <div className="flex items-center justify-center p-8">Loading medicine data...</div>;
  }

  if (!medicine) {
    return <div className="text-center p-8 text-red-500">Medicine not found</div>;
  }

  return (
    <Card className="p-4">
      <h2 className="text-2xl font-bold mb-4">{medicine.name}</h2>
      <p className="text-gray-500 mb-6">{medicine.dosage}</p>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart4 className="h-4 w-4 text-blue-500" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-green-500" />
            <span>Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="countries" className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-purple-500" />
            <span>Countries</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background p-4 rounded-md border">
              <div className="text-sm text-muted-foreground">Average Package Price</div>
              <div className="text-2xl font-bold">
                {formatPrice(medicine.averagePrice || 0, 'USD')}
              </div>
            </div>
            <div className="bg-background p-4 rounded-md border">
              <div className="text-sm text-muted-foreground">Total Quantity Sold</div>
              <div className="text-2xl font-bold">
                {Number(medicine.totalQuantity || 0).toLocaleString()}
              </div>
            </div>
          </div>
          
          {!medicine.averagePrice && !medicine.totalQuantity && (
            <div className="text-center py-8 text-muted-foreground">
              No sales data available for this medicine
            </div>
          )}
        </TabsContent>

        <TabsContent value="transactions">
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex-1">
              <Label htmlFor="currency-toggle" className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Show in {showLocalCurrency ? 'Local Currency' : 'USD'}</span>
              </Label>
            </div>
            <Switch
              id="currency-toggle"
              checked={showLocalCurrency}
              onCheckedChange={setShowLocalCurrency}
            />
          </div>
          
          {isTransactionsLoading ? (
            <div className="text-center py-8">Loading transactions...</div>
          ) : transactions.length > 0 ? (
            <Table>
              <TableCaption>Recent transactions for {medicine.name}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Pills/Package</TableHead>
                  <TableHead className="text-right">Package Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction: Transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {transaction.saleDate ? format(new Date(transaction.saleDate), 'MMM d, yyyy') : 'Unknown date'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.countryName}</Badge>
                    </TableCell>
                    <TableCell>{transaction.quantity}</TableCell>
                    <TableCell className="flex items-center">
                      <Pill className="h-4 w-4 text-purple-500 mr-1" />
                      {transaction.pillsPerPackage || 1}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {displayPrice(
                        transaction.price, 
                        transaction.id, 
                        'transaction',
                        transaction.currency
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No transactions available for this medicine
            </div>
          )}
        </TabsContent>

        <TabsContent value="countries">
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex-1">
              <Label htmlFor="country-currency-toggle" className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Show in {showLocalCurrency ? 'Local Currency' : 'USD'}</span>
              </Label>
            </div>
            <Switch
              id="country-currency-toggle"
              checked={showLocalCurrency}
              onCheckedChange={setShowLocalCurrency}
            />
          </div>
          
          {isCountriesLoading ? (
            <div className="text-center py-8">Loading countries...</div>
          ) : countries.length > 0 ? (
            <Table>
              <TableCaption>{medicine.name} availability by country</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Last Purchase</TableHead>
                  <TableHead>Pills/Package</TableHead>
                  <TableHead className="text-right">Package Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countries.map((country: Country) => (
                  <TableRow key={country.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Flag className="h-4 w-4 text-blue-500 mr-2" />
                        <span>{country.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{country.currency}</TableCell>
                    <TableCell>
                      {country.lastPurchaseDate ? 
                        format(new Date(country.lastPurchaseDate), 'MMM d, yyyy') : 
                        'Unknown date'}
                    </TableCell>
                    <TableCell className="flex items-center">
                      <Pill className="h-4 w-4 text-purple-500 mr-1" />
                      {country.pillsPerPackage || 1}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {displayPrice(
                        country.lastPrice, 
                        country.id, 
                        'country',
                        country.currency
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              This medicine is not available in any country
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default MedicineDetails;
