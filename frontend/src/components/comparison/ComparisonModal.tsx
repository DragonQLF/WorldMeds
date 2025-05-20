
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { ComparisonView } from './ComparisonView';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose
}) => {
  const isMobile = useIsMobile();

  // On mobile, use a full-page Sheet component
  // On desktop, use a centered Dialog component
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-full p-0 overflow-y-auto">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Medicine Price Comparison</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <div className="flex-grow overflow-auto p-4">
              <ComparisonView onClose={onClose} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Medicine Price Comparison</DialogTitle>
          <DialogDescription>
            Compare medicine prices across different countries
          </DialogDescription>
        </DialogHeader>
        <DialogClose className="absolute right-4 top-4" />
        <div className="overflow-auto flex-1 -mx-6 px-6">
          <ComparisonView onClose={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
