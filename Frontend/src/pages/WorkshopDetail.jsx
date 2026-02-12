import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Star, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle,
  Crown,
  Calendar,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  User,
  Award
} from 'lucide-react';
import CategoryBadges from '@/components/workshop/CategoryBadges';

export default function WorkshopDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const workshopId = urlParams.get('id');
  const diagnosis = urlParams.get('diagnosis');
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: workshop, isLoading: loadingWorkshop } = useQuery({
    queryKey: ['workshop', workshopId],
    queryFn: async () => {
      const workshops = await base44.entities.Workshop.filter({ id: workshopId });
      return workshops[0];
    },
    enabled: !!workshopId,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', workshopId],
    queryFn: () => base44.entities.Review.filter({ 
      workshop_id: workshopId, 
      status: 'approved' 
    }),
    enabled: !!workshopId,
  });

  if (loadingWorkshop) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Officina non trovata</h2>
            <p className="text-slate-500 mb-4">L'officina richiesta non esiste o non è più disponibile.</p>
            <Link to={createPageUrl('SearchWorkshops')}>
              <Button>Torna alla ricerca</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const images = workshop.photos?.length > 0 ? workshop.photos : [];
  
  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            className={`h-4 w-4 ${star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="relative h-64 md:h-96 bg-slate-900">
          <img 
            src={images[currentImageIndex]} 
            alt={workshop.name}
            className="w-full h-full object-cover"
          />
          {images.length > 1 && (
            <>
              <button 
                onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full hover:bg-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full hover:bg-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2 h-2 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Diagnosis Banner */}
        {diagnosis && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>La tua diagnosi AI:</strong> {diagnosis}
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold">{workshop.name}</h1>
              {workshop.is_premium && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-slate-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{workshop.address}, {workshop.city}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              {renderStars(workshop.average_rating || 0)}
              <span className="font-medium">{workshop.average_rating?.toFixed(1) || '-'}</span>
              <span className="text-slate-500">({workshop.total_reviews || 0} recensioni)</span>
            </div>
            
            {/* Gold Badges */}
            <div className="mt-2">
              <CategoryBadges categoryRatings={workshop.category_ratings} compact />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {workshop.phone && (
              <a href={`tel:${workshop.phone}`}>
                <Button variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Chiama
                </Button>
              </a>
            )}
            <Link to={createPageUrl('BookAppointment') + `?workshop=${workshopId}${diagnosis ? `&diagnosis=${encodeURIComponent(diagnosis)}` : ''}`}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Calendar className="h-4 w-4 mr-2" />
                Prenota Appuntamento
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList>
            <TabsTrigger value="info">Informazioni</TabsTrigger>
            <TabsTrigger value="services">Servizi</TabsTrigger>
            <TabsTrigger value="reviews">Recensioni ({reviews.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Descrizione</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    {workshop.description || 'Nessuna descrizione disponibile.'}
                  </p>
                </CardContent>
              </Card>
              
              {/* Category Ratings Card */}
              {workshop.category_ratings && Object.keys(workshop.category_ratings).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      Rating per Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CategoryBadges categoryRatings={workshop.category_ratings} />
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Orari di Apertura
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {workshop.opening_hours ? (
                    <div className="space-y-2">
                      {Object.entries(workshop.opening_hours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between">
                          <span className="capitalize">{day}</span>
                          <span className="text-slate-600">{hours || 'Chiuso'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500">Orari non specificati</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="services">
            <Card>
              <CardContent className="p-6">
                {workshop.services?.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {workshop.services.map(service => (
                      <div key={service} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>{service}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">
                    Nessun servizio specificato
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews">
            {reviews.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nessuna recensione</h3>
                  <p className="text-slate-500">
                    Questa officina non ha ancora recensioni verificate
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-medium">{review.customer_name}</p>
                            <p className="text-sm text-slate-500">{review.service_received}</p>
                          </div>
                        </div>
                        {renderStars(review.rating)}
                      </div>
                      {review.title && (
                        <h4 className="font-medium mt-3">{review.title}</h4>
                      )}
                      <p className="text-slate-600 mt-1">{review.comment}</p>
                      <div className="flex items-center gap-1 mt-3 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        Recensione verificata
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}