import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  calculateReviewScore, 
  updateCategoryRatings, 
  calculateOverallRating 
} from '@/components/workshop/ratingCalculator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Star, 
  CheckCircle, 
  XCircle, 
  User,
  Building2,
  MessageSquare,
  AlertTriangle,
  Loader2,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedReview, setSelectedReview] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedWorkshopId, setSelectedWorkshopId] = useState('');

  const { data: pendingReviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: ['pendingReviews'],
    queryFn: () => base44.entities.Review.filter({ status: 'pending' }),
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ['allReviews'],
    queryFn: () => base44.entities.Review.list(),
  });

  const { data: workshops = [] } = useQuery({
    queryKey: ['allWorkshops'],
    queryFn: () => base44.entities.Workshop.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: allAppointments = [] } = useQuery({
    queryKey: ['allAppointments'],
    queryFn: () => base44.entities.Appointment.list(),
  });

  const updateReview = useMutation({
    mutationFn: async ({ id, status, admin_notes, workshop_id, rating, review }) => {
      await base44.entities.Review.update(id, { status, admin_notes });
      
      // Update workshop rating if approved using multi-factor system
      if (status === 'approved') {
        const workshop = workshops.find(w => w.id === workshop_id);
        const appointment = allAppointments.find(a => a.id === review.appointment_id);
        
        // Get diagnosis correctness from appointment completion feedback
        const diagnosisCorrect = appointment?.completion_feedback?.diagnosis_correct;
        
        // Calculate multi-factor score
        const reviewScore = calculateReviewScore({
          customerRating: rating,
          commentText: review.comment,
          diagnosisCorrect: diagnosisCorrect,
          serviceRequested: review.service_received || appointment?.service_requested,
          workshopServices: workshop?.services || []
        });

        // Update category ratings
        const category = review.service_received || appointment?.service_requested;
        const newCategoryRatings = updateCategoryRatings(
          workshop?.category_ratings || {},
          category,
          reviewScore
        );

        // Calculate new overall rating
        const newOverallRating = calculateOverallRating(newCategoryRatings);
        const newTotalReviews = (workshop?.total_reviews || 0) + 1;
        
        await base44.entities.Workshop.update(workshop_id, {
          average_rating: newOverallRating,
          total_reviews: newTotalReviews,
          category_ratings: newCategoryRatings
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingReviews'] });
      queryClient.invalidateQueries({ queryKey: ['allReviews'] });
      queryClient.invalidateQueries({ queryKey: ['allWorkshops'] });
      setSelectedReview(null);
      setRejectReason('');
    },
  });

  const getWorkshop = (id) => workshops.find(w => w.id === id);

  const renderStars = (rating) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star 
          key={star} 
          className={`h-4 w-4 ${star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'}`} 
        />
      ))}
    </div>
  );

  const stats = {
    pendingReviews: pendingReviews.length,
    totalWorkshops: workshops.length,
    premiumWorkshops: workshops.filter(w => w.is_premium).length,
    totalUsers: users.length,
  };

  if (loadingReviews) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Pannello Admin</h1>
          
          {/* Workshop Simulator */}
          <div className="flex items-center gap-2">
            <Select value={selectedWorkshopId} onValueChange={setSelectedWorkshopId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Simula officina..." />
              </SelectTrigger>
              <SelectContent>
                {workshops.map(w => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} - {w.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => navigate(createPageUrl('WorkshopDashboard') + `?admin_simulate=${selectedWorkshopId}`)}
              disabled={!selectedWorkshopId}
              variant="outline"
            >
              <Eye className="h-4 w-4 mr-2" />
              Visualizza
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.pendingReviews}</div>
                  <div className="text-sm text-slate-500">Recensioni da approvare</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalWorkshops}</div>
                  <div className="text-sm text-slate-500">Officine totali</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.premiumWorkshops}</div>
                  <div className="text-sm text-slate-500">Officine premium</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <div className="text-sm text-slate-500">Utenti registrati</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="reviews">
          <TabsList className="mb-4">
            <TabsTrigger value="reviews">
              Recensioni ({pendingReviews.length} in attesa)
            </TabsTrigger>
            <TabsTrigger value="workshops">
              Officine ({workshops.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reviews">
            {pendingReviews.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Nessuna recensione in attesa</h3>
                  <p className="text-slate-500">Tutte le recensioni sono state verificate</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingReviews.map(review => {
                  const workshop = getWorkshop(review.workshop_id);
                  return (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{review.customer_name}</span>
                              <span className="text-slate-400">→</span>
                              <span className="text-blue-600">{workshop?.name || 'Officina'}</span>
                            </div>
                            {renderStars(review.rating)}
                          </div>
                          <Badge>In attesa</Badge>
                        </div>
                        
                        {review.title && (
                          <h4 className="font-medium mt-2">{review.title}</h4>
                        )}
                        <p className="text-slate-600 mt-1">{review.comment}</p>
                        
                        <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
                          <span>Servizio: {review.service_received}</span>
                          <span>•</span>
                          <span>{format(new Date(review.created_date), 'd MMM yyyy', { locale: it })}</span>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button 
                            onClick={() => updateReview.mutate({
                              id: review.id,
                              status: 'approved',
                              workshop_id: review.workshop_id,
                              rating: review.rating,
                              review: review
                            })}
                            disabled={updateReview.isPending}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {updateReview.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Approva
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => setSelectedReview(review)}
                            className="flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rifiuta
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="workshops">
            <div className="space-y-4">
              {workshops.map(workshop => (
                <Card key={workshop.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-slate-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{workshop.name}</h3>
                            {workshop.is_premium && (
                              <Badge className="bg-yellow-100 text-yellow-800">Premium</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">{workshop.city}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span>{workshop.average_rating?.toFixed(1) || '-'}</span>
                        </div>
                        <p className="text-sm text-slate-500">{workshop.total_reviews || 0} recensioni</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reject Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Rifiuta Recensione
            </DialogTitle>
          </DialogHeader>
          <div>
            <p className="text-sm text-slate-500 mb-3">
              Inserisci il motivo del rifiuto (non verrà mostrato pubblicamente)
            </p>
            <Textarea
              placeholder="Motivo del rifiuto..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReview(null)}>
              Annulla
            </Button>
            <Button 
              variant="destructive"
              onClick={() => updateReview.mutate({
                id: selectedReview.id,
                status: 'rejected',
                admin_notes: rejectReason
              })}
              disabled={updateReview.isPending}
            >
              {updateReview.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Conferma Rifiuto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}