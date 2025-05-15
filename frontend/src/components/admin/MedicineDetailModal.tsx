
import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Medicine, MedicineTransaction, MedicineCountry } from "@/services/AdminService";
import { Pill, Calendar, ShoppingCart, DollarSign, Flag, Globe } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface MedicineDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicine: Medicine | null;
  transactions: MedicineTransaction[] | null;
  isLoading: boolean;
}

const MedicineDetailModal: React.FC<MedicineDetailModalProps> = ({
  isOpen,
  onClose,
  medicine,
  transactions,
  isLoading
}) => {
  // Fetch countries where this medicine is available
  const { data: countries = [], isLoading: isCountriesLoading } = useQuery({
    queryKey: ["medicine", medicine?.id, "countries"],
    queryFn: async () => {
      if (!medicine?.id) return [];
      const response = await api.get(`/admin/medicines/${medicine.id}/countries`);
      return response.data;
    },
    enabled: isOpen && !!medicine?.id,
  });

  // Calculate average price from transactions
  const calculateAveragePrice = () => {
    if (!transactions || transactions.length === 0) return "N/A";
    
    const total = transactions.reduce((sum, transaction) => sum + transaction.price, 0);
    return (total / transactions.length).toFixed(2);
  };
  
  // Calculate total quantity from transactions
  const calculateTotalQuantity = () => {
    if (!transactions || transactions.length === 0) return "N/A";
    
    return transactions.reduce((sum, transaction) => sum + transaction.quantity, 0);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Pill className="h-5 w-5 text-blue-500" />
            <span>{isLoading ? "Loading..." : medicine?.name}</span>
          </DialogTitle>
          <DialogDescription>
            Detailed information about this medicine
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList className="w-full">
              <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
              <TabsTrigger value="transactions" className="flex-1">Transactions</TabsTrigger>
              <TabsTrigger value="countries" className="flex-1">Countries</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4 flex flex-col items-center justify-center">
                    <Pill className="h-5 w-5 text-blue-500 mb-2" />
                    <p className="text-sm text-blue-600 dark:text-blue-300 font-semibold">{medicine?.dosage || "No dosage specified"}</p>
                    <p className="text-xs text-blue-500/70 dark:text-blue-400/70">Dosage</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-4 flex flex-col items-center justify-center">
                    <Flag className="h-5 w-5 text-purple-500 mb-2" />
                    <p className="text-sm text-purple-600 dark:text-purple-300 font-semibold">{countries.length || 0}</p>
                    <p className="text-xs text-purple-500/70 dark:text-purple-400/70">Countries</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-4 flex flex-col items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-green-500 mb-2" />
                    <p className="text-sm text-green-600 dark:text-green-300 font-semibold">{calculateTotalQuantity()}</p>
                    <p className="text-xs text-green-500/70 dark:text-green-400/70">Total Quantity</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <CardContent className="p-4 flex flex-col items-center justify-center">
                    <DollarSign className="h-5 w-5 text-amber-500 mb-2" />
                    <p className="text-sm text-amber-600 dark:text-amber-300 font-semibold">{calculateAveragePrice()}</p>
                    <p className="text-xs text-amber-500/70 dark:text-amber-400/70">Average Package Price</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="transactions">
              <ScrollArea className="h-[300px] mt-4">
                {!transactions || transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No transactions available for this medicine.</p>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((transaction) => (
                      <Card key={transaction.id} className="p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium flex items-center">
                              <Flag className="h-3 w-3 mr-1 text-violet-500" />
                              {transaction.countryName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.saleDate && 
                                format(new Date(transaction.saleDate), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="flex space-x-2 items-center">
                            <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                              <ShoppingCart className="h-3 w-3 mr-1" />
                              {transaction.quantity}
                            </Badge>
                            <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {transaction.price}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="countries">
              {isCountriesLoading ? (
                <div className="flex justify-center py-8">
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : countries.length > 0 ? (
                <ScrollArea className="h-[300px] mt-4">
                  <div className="space-y-2">
                    {countries.map((country: MedicineCountry) => (
                      <Card key={country.id} className="p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium flex items-center">
                              <Globe className="h-3 w-3 mr-1 text-blue-500" />
                              {country.name} 
                              <span className="ml-2 text-xs text-muted-foreground">({country.currency})</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {country.lastPurchaseDate && 
                                format(new Date(country.lastPurchaseDate), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="flex space-x-2 items-center">
                            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                              <Pill className="h-3 w-3 mr-1" />
                              {country.pillsPerPackage || 1}
                            </Badge>
                            <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {Number(country.lastPrice).toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground mt-4">
                  This medicine is not available in any country
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MedicineDetailModal;
