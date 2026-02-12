import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  MapPin, 
  Star, 
  Phone, 
  Clock,
  Filter,
  X,
  CheckCircle,
  Crown
} from 'lucide-react';

const SERVICE_OPTIONS = [
  'Meccanica generale',
  'Elettrauto',
  'Carrozzeria',
  'Gommista',
  'Tagliando',
  'Revisione',
  'Climatizzatore',
  'Freni',
  'Sospensioni',
  'Cambio olio',
  'Diagnosi elettronica',
  'Riparazione motore'
];

export default function SearchWorkshops() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';
  const initialService = urlParams.get('service') || '';
  const initialDiagnosis = urlParams.get('diagnosis') || '';

  const [searchCity, setSearchCity] = useState(initialQuery);
  const [selectedServices, setSelectedServices] = useState(
    initialService ? [initialService] : []
  );
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);

  const { data: workshops = [], isLoading } = useQuery({
    queryKey: ['workshops'],
    queryFn: () => base44.entities.Workshop.filter({ status: 'active' }),
  });

  // Filter and sort workshops
  const filteredWorkshops = workshops
    .filter(workshop => {
      const matchesCity = !searchCity || 
        workshop.city?.toLowerCase().includes(searchCity.toLowerCase()) ||
        workshop.zone?.toLowerCase().includes(searchCity.toLowerCase()) ||
        workshop.address?.toLowerCase().includes(searchCity.toLowerCase());
      
      const matchesServices = selectedServices.length === 0 ||
        selectedServices.some(service => workshop.services?.includes(service));
      
      return matchesCity && matchesServices;
    })
    .sort((a, b) => {
      // Premium workshops first
      if (a.is_premium && !b.is_premium) return -1;
      if (!a.is_premium && b.is_premium) return 1;
      
      // Then by selected criteria
      if (sortBy === 'rating') {
        return (b.average_rating || 0) - (a.average_rating || 0);
      }
      if (sortBy === 'reviews') {
        return (b.total_reviews || 0) - (a.total_reviews || 0);
      }
      return 0;
    });

  const toggleService = (service) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Search Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Cerca per città o zona..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Ordina per" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Valutazione migliore</SelectItem>
                <SelectItem value="reviews">Più recensioni</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtri
            </Button>
          </div>

          {/* Diagnosis Banner */}
          {initialDiagnosis && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Diagnosi AI:</strong> {initialDiagnosis}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className={`
            ${showFilters ? 'fixed inset-0 z-50 bg-white p-4 overflow-auto' : 'hidden'} 
            md:block md:relative md:w-64 md:flex-shrink-0
          `}>
            <div className="flex items-center justify-between mb-4 md:hidden">
              <h3 className="font-semibold">Filtri</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="bg-white rounded-lg border p-4 md:sticky md:top-24">
              <h3 className="font-semibold mb-4">Servizi</h3>
              <div className="space-y-3">
                {SERVICE_OPTIONS.map(service => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={service}
                      checked={selectedServices.includes(service)}
                      onCheckedChange={() => toggleService(service)}
                    />
                    <Label htmlFor={service} className="text-sm cursor-pointer">
                      {service}
                    </Label>
                  </div>
                ))}
              </div>
              
              {selectedServices.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-4 w-full"
                  onClick={() => setSelectedServices([])}
                >
                  Cancella filtri
                </Button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            <p className="text-sm text-slate-500 mb-4">
              {filteredWorkshops.length} officine trovate
            </p>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <Skeleton className="w-32 h-32 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredWorkshops.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nessuna officina trovata</h3>
                  <p className="text-slate-500">
                    Prova a modificare i filtri o la zona di ricerca
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredWorkshops.map(workshop => (
                  <Link 
                    key={workshop.id} 
                    to={createPageUrl('WorkshopDetail') + `?id=${workshop.id}${initialDiagnosis ? `&diagnosis=${encodeURIComponent(initialDiagnosis)}` : ''}`}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
                            {workshop.photos?.[0] ? (
                              <img 
                                src={workshop.photos[0]} 
                                alt={workshop.name}
                                className="w-full h-full object-cover"
                              />
                            ) : workshop.logo ? (
                              <img 
                                src={workshop.logo} 
                                alt={workshop.name}
                                className="w-full h-full object-contain p-2"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Search className="h-8 w-8" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-lg">{workshop.name}</h3>
                                  {workshop.is_premium && (
                                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                      <Crown className="h-3 w-3 mr-1" />
                                      Premium
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                                  <MapPin className="h-4 w-4" />
                                  {workshop.city}{workshop.zone && `, ${workshop.zone}`}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-medium">
                                  {workshop.average_rating?.toFixed(1) || '-'}
                                </span>
                                <span className="text-slate-500 text-sm">
                                  ({workshop.total_reviews || 0})
                                </span>
                              </div>
                            </div>
                            
                            {workshop.description && (
                              <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                                {workshop.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap gap-1 mt-3">
                              {workshop.services?.slice(0, 4).map(service => (
                                <Badge key={service} variant="secondary" className="text-xs">
                                  {service}
                                </Badge>
                              ))}
                              {workshop.services?.length > 4 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{workshop.services.length - 4}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}