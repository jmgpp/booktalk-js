import React from 'react';
import { cn } from '@/lib/utils';

type StatVariant = 'pink' | 'orange' | 'yellow' | 'teal' | 'blue';

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description?: string;
  variant?: StatVariant;
}

const variantStyles: Record<StatVariant, string> = {
  pink: 'bg-palette-pink/10 border-palette-pink text-palette-pink',
  orange: 'bg-palette-orange/10 border-palette-orange text-palette-orange',
  yellow: 'bg-palette-yellow/10 border-palette-yellow text-palette-yellow',
  teal: 'bg-palette-teal/10 border-palette-teal text-palette-teal',
  blue: 'bg-palette-blue/10 border-palette-blue text-palette-blue',
};

export function StatsCard({ 
  icon, 
  label, 
  value, 
  description, 
  variant = 'pink' 
}: StatsCardProps) {
  return (
    <div className={cn(
      "rounded-xl border p-4 flex flex-col h-full transition-all duration-200 hover:scale-102 hover:shadow-lg",
      variantStyles[variant]
    )}>
      <div className="flex items-center mb-2">
        <div className="mr-2">
          {icon}
        </div>
        <p className="text-sm font-medium">{label}</p>
      </div>
      <div className="mt-1">
        <p className="text-2xl font-bold">{value}</p>
        {description && (
          <p className="text-sm opacity-75 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
} 