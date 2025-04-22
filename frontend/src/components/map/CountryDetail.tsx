
import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
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
  const { data: countryDetails, isLoading } = useQuery({
    queryKey: ["countryDetails", countryId],
    queryFn: async () => {
      if (!countryId) return null;
      const response = await axios.get(`/api/country/${countryId}/details`);
      return response.data;
    },
    enabled: !!countryId,
  });

  const { data: topMedicines = [], isLoading: isLoadingMedicines } = useQuery({
    queryKey: ["topMedicines", countryId],
    queryFn: async () => {
      if (!countryId) return [];
      const response = await axios.get(`/api/country/${countryId}/top-medicines`);
      return response.data;
    },
    enabled: !!countryId,
  });

  return (
    <Sheet open={!!countryId} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
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
                    ${countryDetails.avg_price?.toFixed(2) || "N/A"}
                    {countryDetails.avg_price > 10 ? (
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
                        <span>${medicine.averagePrice?.toFixed(2)}</span>
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
