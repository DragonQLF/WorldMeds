import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HistoryChart } from "./HistoryChart";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { InfoIcon } from 'lucide-react';
import { formatPrice } from '@/utils/currencyUtils';
import { getCurrencySymbol } from '@/utils/currencyUtils';

interface MedicineHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartData: { labels: string[]; datasets: { label: string; data: number[]; borderColor: string; backgroundColor: string; tension?: number; }[] };
  medicineName: string;
  showLocalCurrency: boolean;
  conversionRate: number;
  localCurrencyCode?: string;
}

export const MedicineHistoryModal: React.FC<MedicineHistoryModalProps> = ({
  isOpen,
  onClose,
  chartData,
  medicineName,
  showLocalCurrency,
  conversionRate,
  localCurrencyCode,
}) => {

  const yAxisLabel = 'Price (USD)';
  const chartTitle = `Historical Global Average Price for ${medicineName} (USD)`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed top-4 left-4 w-full max-w-lg p-6 bg-background dark:bg-background border dark:border-border overflow-hidden shadow-none translate-x-0 translate-y-0 sm:rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Historical Global Average Price for {medicineName}
             <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px]">
                  <p>Global average price of this medicine over time (in USD).</p>
                  {localCurrencyCode && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Displayed in USD as the global average is calculated in USD.
                      Individual country trends may vary.
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4" style={{ height: '300px' }}>
          <HistoryChart 
            data={chartData}
            title={chartTitle}
            yAxisLabel={yAxisLabel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}; 