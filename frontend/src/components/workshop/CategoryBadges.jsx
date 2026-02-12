import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Award,
  Wrench,
  Zap,
  Car,
  CircleDot,
  Gauge,
  FileCheck,
  Snowflake,
  Disc,
  Settings,
  Droplet,
  Cpu
} from 'lucide-react';

const CATEGORY_ICONS = {
  'Meccanica generale': Wrench,
  'Elettrauto': Zap,
  'Carrozzeria': Car,
  'Gommista': CircleDot,
  'Tagliando': Gauge,
  'Revisione': FileCheck,
  'Climatizzatore': Snowflake,
  'Freni': Disc,
  'Sospensioni': Settings,
  'Cambio olio': Droplet,
  'Diagnosi elettronica': Cpu,
  'Riparazione motore': Settings,
};

export default function CategoryBadges({ categoryRatings, compact = false }) {
  if (!categoryRatings || Object.keys(categoryRatings).length === 0) {
    return null;
  }

  const categories = Object.entries(categoryRatings)
    .filter(([_, data]) => data.count >= 5) // Show only categories with at least 5 reviews
    .sort((a, b) => b[1].rating - a[1].rating);

  if (categories.length === 0) return null;

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            className={`h-3 w-3 ${
              star <= fullStars 
                ? 'text-yellow-500 fill-yellow-500' 
                : star === fullStars + 1 && hasHalf
                  ? 'text-yellow-500 fill-yellow-500/50'
                  : 'text-slate-300'
            }`} 
          />
        ))}
      </div>
    );
  };

  if (compact) {
    // Show only gold badges in compact mode
    const goldBadges = categories.filter(([_, data]) => data.gold_badge);
    if (goldBadges.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1">
        {goldBadges.map(([category, data]) => {
          const Icon = CATEGORY_ICONS[category] || Wrench;
          return (
            <Badge 
              key={category} 
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0 gap-1"
            >
              <Award className="h-3 w-3" />
              <Icon className="h-3 w-3" />
              {category}
            </Badge>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {categories.map(([category, data]) => {
        const Icon = CATEGORY_ICONS[category] || Wrench;
        const isGold = data.gold_badge;
        
        return (
          <div 
            key={category}
            className={`flex items-center justify-between p-2 rounded-lg ${
              isGold 
                ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-300' 
                : 'bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              {isGold && <Award className="h-4 w-4 text-yellow-600" />}
              <Icon className={`h-4 w-4 ${isGold ? 'text-yellow-600' : 'text-slate-500'}`} />
              <span className={`text-sm font-medium ${isGold ? 'text-yellow-800' : ''}`}>
                {category}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {renderStars(data.rating)}
              <span className="text-xs text-slate-500">({data.count})</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}