
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Country } from "@/services/AdminService";
import { Map, Globe, DollarSign, Pill } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface CountryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  country: Country | null;
  isLoading: boolean;
}

const CountryDetailModal: React.FC<CountryDetailModalProps> = ({
  isOpen,
  onClose,
  country,
  isLoading
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-green-500" />
            <span>{isLoading ? "Loading..." : country?.name}</span>
          </DialogTitle>
          <DialogDescription>
            Detailed information about this country
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <Map className="h-5 w-5 text-green-500 mb-2" />
                  <p className="text-sm text-green-600 dark:text-green-300 font-semibold">{country?.name}</p>
                  <p className="text-xs text-green-500/70 dark:text-green-400/70">Country</p>
                </CardContent>
              </Card>
              
              <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <DollarSign className="h-5 w-5 text-amber-500 mb-2" />
                  <p className="text-sm text-amber-600 dark:text-amber-300 font-semibold">{country?.currency}</p>
                  <p className="text-xs text-amber-500/70 dark:text-amber-400/70">Currency</p>
                </CardContent>
              </Card>
            </div>
            
            <Separator className="my-4" />
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-md font-medium flex items-center">
                  <Pill className="h-4 w-4 mr-2 text-purple-500" />
                  Medicine Coverage
                </h3>
                <span className="text-sm text-muted-foreground">
                  {country?.medicineCount || 0} medicines
                </span>
              </div>
              
              <Progress 
                value={country?.medicineCount ? Math.min((country.medicineCount / 20) * 100, 100) : 0}
                className="h-2 bg-purple-100 dark:bg-purple-900/30"
                indicatorClassName="bg-purple-500" 
              />
              
              <p className="text-xs text-muted-foreground mt-2">
                This represents the relative coverage of medicines in this country compared to a benchmark of 20 medicines.
              </p>
            </div>
            
            <Card className="mt-4 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
              <CardContent className="p-4">
                <p className="text-sm">
                  <span className="font-medium">Regional Information:</span> {country?.name} uses {country?.currency} as its currency and has data for {country?.medicineCount || 0} medicines in our database.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Click on the Medicines tab to see which medicines are available in this country.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CountryDetailModal;
