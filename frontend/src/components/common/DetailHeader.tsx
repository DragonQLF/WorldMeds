import React from 'react';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

interface DetailHeaderProps {
  title: string;
  description: string;
}

export const DetailHeader: React.FC<DetailHeaderProps> = ({ title, description }) => (
  <SheetHeader className="pb-4">
    <SheetTitle>{title}</SheetTitle>
    <SheetDescription>{description}</SheetDescription>
  </SheetHeader>
); 