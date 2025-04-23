import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface CountryDetailProps {
  countryId: string | null;
  onClose: () => void;
}

export const CountryDetail: React.FC<CountryDetailProps> = ({ countryId, onClose }) => {
  // Debug logging
  useEffect(() => {
    console.log("CountryDetail rendered with countryId:", countryId);
  }, [countryId]);

  const { data: countryDetails, isLoading } = useQuery({
    queryKey: ["countryDetails", countryId],
    queryFn: async () => {
      if (!countryId) return null;
      console.log(`Fetching details for country ID: ${countryId}`);
      try {
        const response = await api.get(`/country/${countryId}/details`);
        console.log("Country details API response:", response.data);
        return response.data;
      } catch (error) {
        console.error("Error fetching country details:", error);
        return null;
      }
    },
    enabled: !!countryId,
  });

  const { data: topMedicines = [], isLoading: isLoadingMedicines } = useQuery({
    queryKey: ["topMedicines", countryId],
    queryFn: async () => {
      if (!countryId) return [];
      const response = await api.get(`/country/${countryId}/top-medicines`);
      return response.data;
    },
    enabled: !!countryId,
  });

  const formatPrice = (price: any): string => {
    if (typeof price === 'number') {
      return price.toFixed(2);
    }
    const parsedPrice = parseFloat(String(price));
    return !isNaN(parsedPrice) ? parsedPrice.toFixed(2) : "N/A";
  };

  return (
    <Sheet open={!!countryId} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <SheetContent 
        className="w-full sm:max-w-md overflow-y-auto bg-background dark:bg-background border dark:border-border overflow-hidden" 
        side="right"
      >
        <SheetHeader className="pb-4">
          <SheetTitle>{countryDetails?.name || "Country Details"}</SheetTitle>
          <SheetDescription>
            Medicine pricing and consumption details
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <p>Loading country details...</p>
          </div>
        ) : countryDetails ? (
          <div className="space-y-6">
            <div className="bg-card rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-medium mb-2">Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Currency</span>
                  <span className="font-medium">{countryDetails.currency}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Total Medicines</span>
                  <span className="font-medium">{countryDetails.total_medicines?.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Average Price</span>
                  <span className="font-medium flex items-center">
                    ${formatPrice(countryDetails.avg_price)}
                    {parseFloat(String(countryDetails.avg_price)) > 10 ? (
                      <ArrowUpRight className="ml-1 h-4 w-4 text-red-500" />
                    ) : (
                      <ArrowDownRight className="ml-1 h-4 w-4 text-green-500" />
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-medium mb-2">Top Medicines</h3>
              {isLoadingMedicines ? (
                <p className="text-center py-2">Loading medicines...</p>
              ) : (
                <div className="space-y-3">
                  {topMedicines.map((medicine: any) => (
                    <div key={medicine.name} className="border-b pb-2 last:border-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{medicine.name}</span>
                        <span>${formatPrice(medicine.averagePrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{medicine.dosage}</span>
                        <span>Sold: {medicine.totalSold}</span>
                      </div>
                    </div>
                  ))}

                  {topMedicines.length === 0 && (
                    <p className="text-center py-2">No medicines found</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <p>No country details available</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
