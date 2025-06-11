import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HistoryChart } from "./HistoryChart";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { InfoIcon } from 'lucide-react';
import { formatPrice } from '@/utils/currencyUtils';
import { getCurrencySymbol } from '@/utils/currencyUtils';

interface CountryHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartData: { labels: string[]; datasets: { label: string; data: number[]; borderColor: string; backgroundColor: string; tension?: number; }[] };
  countryName: string;
  showLocalCurrency: boolean;
  conversionRate: number;
  localCurrencyCode: string;
}

export const CountryHistoryModal: React.FC<CountryHistoryModalProps> = ({
  isOpen,
  onClose,
  chartData,
  countryName,
  showLocalCurrency,
  conversionRate,
  localCurrencyCode,
}) => {

  const adjustedChartData = React.useMemo(() => {
    if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
      return { labels: [], datasets: [] };
    }

    const originalData = chartData.datasets[0].data;
    const convertedData = showLocalCurrency
      ? originalData.map(price => price * (1 / conversionRate))
      : originalData;

    const currencyLabel = showLocalCurrency ? localCurrencyCode : 'USD';

    return {
      labels: chartData.labels,
      datasets: [
        {
          ...chartData.datasets[0],
          label: `Average Price (${currencyLabel})`,
          data: convertedData,
        },
      ],
    };
  }, [chartData, showLocalCurrency, conversionRate, localCurrencyCode]);

  const yAxisLabel = showLocalCurrency ? `Price (${localCurrencyCode})` : 'Price (USD)';
  const chartTitle = `Average Price History in ${countryName} (${showLocalCurrency ? localCurrencyCode : 'USD'})`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed top-4 left-4 w-full max-w-lg p-6 bg-background dark:bg-background border dark:border-border overflow-hidden shadow-none translate-x-0 translate-y-0 sm:rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Historical Average Price in {countryName}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px]">
                  <p>Average price of medicines over time</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4" style={{ height: '300px' }}>
          <HistoryChart 
            data={adjustedChartData}
            title={chartTitle}
            yAxisLabel={yAxisLabel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}; 