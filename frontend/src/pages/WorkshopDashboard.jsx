import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Car, 
  User,
  Phone,
  MessageCircle,
  CheckCircle,
  XCircle,
  Star,
  Crown,
  Settings,
  Loader2,
  BarChart3
} from 'lucide-react';
import AnalyticsPanel from '@/components/workshop/AnalyticsPanel';
import CompletionFeedbackDialog from '@/components/workshop/CompletionFeedbackDialog';
import CategoryBadges from '@/components/workshop/CategoryBadges';
import OutlookCalendar from '@/components/workshop/OutlookCalendar';

import { updateAIAccuracy } from '@/components/workshop/ratingCalculator';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { notifyAppointmentConfirmed, notifyTimeChangeProposed, notifyAppointmentDeclined, notifyAppointmentCompleted } from '@/components/notifications/notificationHelpers';

export default function WorkshopDashboard() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const adminSimulateId = urlParams.get('admin_simulate');
  
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [confirmDate, setConfirmDate] = useState(null);
  const [confirmTime, setConfirmTime] = useState('');
  const [workshopMessage, setWorkshopMessage] = useState('');
  const [selectedChatHistory, setSelectedChatHistory] = useState(null);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [appointmentToComplete, setAppointmentToComplete] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // TEST FEATURE: Check localStorage for test workshop ID
  const testWorkshopId = localStorage.getItem('testWorkshopId');
  const workshopIdToFetch = testWorkshopId || adminSimulateId || user?.workshop_id;

  const { data: workshop, isLoading: loadingWorkshop } = useQuery({
    queryKey: ['myWorkshop', workshopIdToFetch],
    queryFn: async () => {
      const workshops = await base44.entities.Workshop.filter({ id: workshopIdToFetch });
      return workshops[0];
    },
    enabled: !!workshopIdToFetch,
  });

  const { data: appointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: ['workshopAppointments', workshop?.id],
    queryFn: () => base44.entities.Appointment.filter({ workshop_id: workshop.id }),
    enabled: !!workshop?.id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['workshopReviews', workshop?.id],
    queryFn: () => base44.entities.Review.filter({ workshop_id: workshop.id, status: 'approved' }),
    enabled: !!workshop?.id,
  });

  const updateAppointment = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Appointment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshopAppointments'] });
    },
  });

  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const confirmedAppointments = appointments.filter(a => a.status === 'confirmed');
  const completedAppointments = appointments.filter(a => ['completed', 'cancelled', 'declined'].includes(a.status));

  const handleConfirm = async () => {
    if (!confirmDate || !confirmTime) return;
    
    const formattedDate = format(confirmDate, 'yyyy-MM-dd');
    
    await updateAppointment.mutateAsync({
      id: selectedAppointment.id,
      data: {
        status: 'pending',
        confirmed_date: formattedDate,
        confirmed_time: confirmTime,
        workshop_message: workshopMessage,
        awaiting_confirmation_from: 'customer'
      }
    });
    
    notifyTimeChangeProposed(selectedAppointment, workshop, 'workshop');
    
    setConfirmDate(null);
    setConfirmTime('');
    setWorkshopMessage('');
    setSelectedAppointment(null);
  };

  const handleDecline = async (appointment) => {
    await updateAppointment.mutateAsync({
      id: appointment.id,
      data: { status: 'declined', workshop_message: workshopMessage || 'Appuntamento non disponibile' }
    });
    notifyAppointmentDeclined(appointment, workshop);
  };

  const handleOpenCompletionDialog = (appointment) => {
    setAppointmentToComplete(appointment);
    setCompletionDialogOpen(true);
  };

  const handleCompleteWithFeedback = async (feedback) => {
    // Update appointment with completion feedback
    await updateAppointment.mutateAsync({
      id: appointmentToComplete.id,
      data: { 
        status: 'completed', 
        car_returned: true,
        amount_spent: feedback.amount_spent,
        completion_feedback: feedback
      }
    });

    // Update workshop AI accuracy if there was an AI diagnosis
    if (appointmentToComplete.ai_chat_history && appointmentToComplete.ai_chat_history.length > 0) {
      const newAIAccuracy = updateAIAccuracy(
        workshop.ai_accuracy_score || 0,
        workshop.ai_accuracy_count || 0,
        feedback.diagnosis_correct
      );

      await base44.entities.Workshop.update(workshop.id, {
        ai_accuracy_score: newAIAccuracy.score,
        ai_accuracy_count: newAIAccuracy.count
      });
    }

    // Notify customer
    notifyAppointmentCompleted(appointmentToComplete, workshop);

    setCompletionDialogOpen(false);
    setAppointmentToComplete(null);
  };

  if (loadingWorkshop) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Nessuna officina registrata</h2>
            <p className="text-slate-500 mb-4">Registra la tua officina per iniziare a ricevere prenotazioni.</p>
            <Link to={createPageUrl('WorkshopRegister')}>
              <Button>Registra Officina</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const AppointmentCard = ({ appointment, showActions = true }) => {
    const handleConfirmDirect = async () => {
      await updateAppointment.mutateAsync({
        id: appointment.id,
        data: {
          status: 'confirmed',
          confirmed_date: appointment.preferred_date,
          confirmed_time: appointment.preferred_time,
          awaiting_confirmation_from: null
        }
      });
      notifyAppointmentConfirmed(appointment, workshop);
    };

    const handleChangeTime = () => {
      setSelectedAppointment(appointment);
      setConfirmDate(appointment.preferred_date ? new Date(appointment.preferred_date) : new Date());
      setConfirmTime(appointment.preferred_time || '');
    };

    return (
      <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">{appointment.customer_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                  <Phone className="h-4 w-4" />
                  {appointment.customer_phone}
                </div>
              </div>
              <Badge variant={
                appointment.status === 'pending' ? 'secondary' :
                appointment.status === 'confirmed' ? 'default' : 'outline'
              }>
                {appointment.status === 'pending' ? 'In attesa' :
                 appointment.status === 'confirmed' ? 'Confermato' :
                 appointment.status === 'completed' ? 'Completato' :
                 appointment.status === 'declined' ? 'Rifiutato' : appointment.status}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-slate-400" />
                <span>{appointment.car_brand} {appointment.car_model} {appointment.car_year}</span>
              </div>
              {appointment.diagnosis && (
                <div className="p-2 bg-blue-50 rounded text-blue-700">
                  <strong>Problema:</strong> {appointment.diagnosis}
                  {appointment.ai_chat_history && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="ml-2 p-0 h-auto text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedChatHistory(appointment.ai_chat_history);
                      }}
                    >
                      Vedi chat AI
                    </Button>
                  )}
                </div>
              )}
              {appointment.service_requested && (
                <div className="text-slate-600">
                  <strong>Servizio:</strong> {appointment.service_requested}
                </div>
              )}
              {appointment.awaiting_confirmation_from === 'workshop' && (
                <div className="p-2 bg-orange-50 border-2 border-orange-400 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-800 font-semibold">
                    <CalendarIcon className="h-4 w-4" />
                    Cliente richiede cambio orario
                  </div>
                  <div className="text-sm text-orange-700 mt-1">
                    Nuova proposta: {format(new Date(appointment.preferred_date), 'd MMM yyyy', { locale: it })}
                    {appointment.preferred_time && ` alle ${appointment.preferred_time}`}
                  </div>
                </div>
              )}
              
              {appointment.preferred_date && !appointment.awaiting_confirmation_from && (
                <div className="flex items-center gap-2 text-slate-500">
                  <CalendarIcon className="h-4 w-4" />
                  Richiesto: {format(new Date(appointment.preferred_date), 'd MMM yyyy', { locale: it })}
                  {appointment.preferred_time && ` alle ${appointment.preferred_time}`}
                </div>
              )}
              {appointment.confirmed_date && appointment.awaiting_confirmation_from !== 'workshop' && (
                <div className="flex items-center gap-2 text-green-600">
                  <CalendarIcon className="h-4 w-4" />
                  Confermato: {format(new Date(appointment.confirmed_date), 'd MMM yyyy', { locale: it })}
                  {appointment.confirmed_time && ` alle ${appointment.confirmed_time}`}
                </div>
              )}
            </div>

            {showActions && (
              <div className="flex gap-2 mt-4">
                <Link to={createPageUrl('Chat') + `?appointment=${appointment.id}`}>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                </Link>
                {appointment.status === 'pending' && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={handleConfirmDirect}
                      disabled={updateAppointment.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Conferma
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={handleChangeTime}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Cambia orario
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDecline(appointment)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {appointment.status === 'confirmed' && (
                  <Button 
                    size="sm"
                    onClick={() => handleOpenCompletionDialog(appointment)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Completa
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Workshop Header */}
        <Card className="mb-6">
          <CardContent className="p-4">
            {adminSimulateId && (
              <Badge className="mb-3 bg-purple-100 text-purple-800">
                Modalità Admin - Simulazione Officina
              </Badge>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Car className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold">{workshop.name}</h1>
                    {workshop.is_premium && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    {workshop.average_rating?.toFixed(1) || '-'} ({workshop.total_reviews || 0} recensioni)
                  </div>
                  <CategoryBadges categoryRatings={workshop.category_ratings} compact />
                </div>
              </div>
              <Link to={createPageUrl('WorkshopSettings')}>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Impostazioni
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingAppointments.length}</div>
              <div className="text-sm text-slate-500">In attesa</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{confirmedAppointments.length}</div>
              <div className="text-sm text-slate-500">Confermati</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{completedAppointments.length}</div>
              <div className="text-sm text-slate-500">Completati</div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments */}
        <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                In Attesa ({pendingAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="confirmed">
                Confermati ({confirmedAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completati ({completedAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Calendario
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-1" />
                Analitiche
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <Star className="h-4 w-4 mr-1" />
                Recensioni ({reviews.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingAppointments.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Nessuna richiesta in attesa</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingAppointments.map(a => <AppointmentCard key={a.id} appointment={a} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="confirmed">
              {confirmedAppointments.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CalendarIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Nessun appuntamento confermato</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {confirmedAppointments.map(a => <AppointmentCard key={a.id} appointment={a} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {completedAppointments.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Nessun appuntamento completato</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {completedAppointments.map(a => <AppointmentCard key={a.id} appointment={a} showActions={false} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="calendar">
              <OutlookCalendar appointments={appointments.filter(a => a.status !== 'declined' && a.status !== 'cancelled')} />
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsPanel appointments={appointments} reviews={reviews} />
            </TabsContent>

            <TabsContent value="reviews">
              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Star className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Nessuna recensione ancora</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{review.customer_name}</span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? 'text-yellow-500 fill-yellow-500'
                                        : 'text-slate-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.service_received && (
                              <Badge variant="outline" className="text-xs">
                                {review.service_received}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(review.created_date).toLocaleDateString('it-IT')}
                          </span>
                        </div>
                        {review.title && (
                          <h4 className="font-semibold mb-1">{review.title}</h4>
                        )}
                        <p className="text-sm text-slate-600">{review.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
      </div>

      {/* Completion Feedback Dialog */}
      <CompletionFeedbackDialog
        open={completionDialogOpen}
        onOpenChange={setCompletionDialogOpen}
        appointment={appointmentToComplete}
        onSubmit={handleCompleteWithFeedback}
        isLoading={updateAppointment.isPending}
      />

      {/* AI Chat History Dialog */}
      <Dialog open={!!selectedChatHistory} onOpenChange={() => setSelectedChatHistory(null)}>
        <DialogContent className="max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Conversazione Diagnosi AI</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedChatHistory?.map((msg, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 ml-8' : 'bg-slate-100 mr-8'}`}
              >
                <p className="text-xs font-medium text-slate-500 mb-1">
                  {msg.role === 'user' ? 'Cliente' : 'Assistente AI'}
                </p>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Time Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => {
        setSelectedAppointment(null);
        setConfirmDate(null);
        setConfirmTime('');
        setWorkshopMessage('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proponi nuova data</DialogTitle>
            {selectedAppointment && (
              <p className="text-sm text-slate-500">Per: {selectedAppointment.customer_name}</p>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <Calendar
              mode="single"
              selected={confirmDate}
              onSelect={setConfirmDate}
              disabled={(date) => date < new Date()}
              locale={it}
              className="rounded-md border"
            />
            <Select value={confirmTime} onValueChange={setConfirmTime}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona orario" />
              </SelectTrigger>
              <SelectContent>
                {['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Messaggio per il cliente (opzionale)..."
              value={workshopMessage}
              onChange={(e) => setWorkshopMessage(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedAppointment(null);
                setConfirmDate(null);
                setConfirmTime('');
                setWorkshopMessage('');
              }}
            >
              Annulla
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!confirmDate || updateAppointment.isPending}
            >
              {updateAppointment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Proponi nuova data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}