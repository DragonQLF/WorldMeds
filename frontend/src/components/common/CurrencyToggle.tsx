import React from 'react';
import { DollarSign } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CurrencyToggleProps {
  showLocalCurrency: boolean;
  onToggle: (checked: boolean) => void;
  localCurrencyCode?: string;
}

export const CurrencyToggle: React.FC<CurrencyToggleProps> = ({
  showLocalCurrency,
  onToggle,
  localCurrencyCode = 'Local',
}) => {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex-1">
        <Label htmlFor="currency-toggle" className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4" />
          <span>{showLocalCurrency ? `Show in USD` : `Show in ${localCurrencyCode}`}</span>
        </Label>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <Switch
                id="currency-toggle"
                checked={showLocalCurrency}
                onCheckedChange={onToggle}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" align="center">
            <p>Toggle between {localCurrencyCode} and USD</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}; 