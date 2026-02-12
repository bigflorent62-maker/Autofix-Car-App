import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  Clock, 
  Car, 
  MapPin,
  MessageCircle,
  Star,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const STATUS_CONFIG = {
  pending: { label: 'In attesa', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Confermato', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  completed: { label: 'Completato', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  cancelled: { label: 'Annullato', color: 'bg-slate-100 text-slate-800', icon: XCircle },
  declined: { label: 'Rifiutato', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function MyAppointments() {
  const [proposeDialog, setProposeDialog] = useState({ open: false, appointment: null, date: '', time: '' });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['myAppointments', user?.email],
    queryFn: () => base44.entities.Appointment.filter({ customer_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: workshops = [] } = useQuery({
    queryKey: ['workshops'],
    queryFn: () => base44.entities.Workshop.list(),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['myReviews', user?.email],
    queryFn: () => base44.entities.Review.filter({ customer_email: user?.email }),
    enabled: !!user?.email,
  });

  const acceptDateMutation = useMutation({
    mutationFn: (appointmentId) => base44.entities.Appointment.update(appointmentId, {
      status: 'confirmed',
      awaiting_confirmation_from: null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAppointments'] });
    }
  });

  const proposeDateMutation = useMutation({
    mutationFn: ({ appointmentId, date, time }) => base44.entities.Appointment.update(appointmentId, {
      preferred_date: date,
      preferred_time: time,
      status: 'pending',
      awaiting_confirmation_from: 'workshop'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAppointments'] });
      setProposeDialog({ open: false, appointment: null, date: '', time: '' });
    }
  });

  const getWorkshop = (workshopId) => workshops.find(w => w.id === workshopId);
  const hasReviewed = (appointmentId) => reviews.some(r => r.appointment_id === appointmentId);

  const handlePropose = () => {
    if (!proposeDialog.date || !proposeDialog.time) {
      alert('Inserisci data e ora');
      return;
    }
    proposeDateMutation.mutate({
      appointmentId: proposeDialog.appointment.id,
      date: proposeDialog.date,
      time: proposeDialog.time
    });
  };

  const activeAppointments = appointments.filter(a => ['pending', 'confirmed'].includes(a.status));
  const pastAppointments = appointments.filter(a => ['completed', 'cancelled', 'declined'].includes(a.status));

  const AppointmentCard = ({ appointment }) => {
    const workshop = getWorkshop(appointment.workshop_id);
    const status = STATUS_CONFIG[appointment.status];
    const StatusIcon = status?.icon || AlertCircle;
    const reviewed = hasReviewed(appointment.id);
    const canReview = appointment.status === 'completed' && appointment.car_returned && !reviewed;
    const needsCustomerConfirmation = appointment.awaiting_confirmation_from === 'customer';

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold">{workshop?.name || 'Officina'}</h3>
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                {workshop?.city}
              </div>
            </div>
            <Badge className={status?.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status?.label}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-slate-400" />
              <span>{appointment.car_brand} {appointment.car_model} {appointment.car_year}</span>
            </div>
            {appointment.diagnosis && (
              <div className="p-2 bg-slate-50 rounded text-slate-600">
                {appointment.diagnosis}
              </div>
            )}
            
            {appointment.awaiting_confirmation_from === 'workshop' && (
              <div className="p-3 bg-blue-50 border-2 border-blue-400 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <p className="font-semibold text-blue-900">
                    Hai richiesto un cambio di data/orario
                  </p>
                </div>
                <div className="text-sm text-blue-800">
                  In attesa di conferma dall'officina
                </div>
              </div>
            )}

            {needsCustomerConfirmation ? (
              <>
                <div className="p-3 bg-orange-50 border-2 border-orange-300 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <p className="font-semibold text-orange-900">
                      L'officina propone una nuova data:
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-orange-800 mb-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-semibold">
                      {format(new Date(appointment.confirmed_date), 'EEEE d MMMM yyyy', { locale: it })}
                      {appointment.confirmed_time && ` alle ${appointment.confirmed_time}`}
                    </span>
                  </div>
                  {appointment.workshop_message && (
                    <p className="text-sm text-orange-700">
                      <strong>Messaggio:</strong> {appointment.workshop_message}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => acceptDateMutation.mutate(appointment.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={acceptDateMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accetta
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => setProposeDialog({ 
                      open: true, 
                      appointment, 
                      date: appointment.preferred_date || '', 
                      time: appointment.preferred_time || '' 
                    })}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Proponi altra data
                  </Button>
                </div>
              </>
            ) : (
              <>
                {appointment.confirmed_date ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(appointment.confirmed_date), 'EEEE d MMMM yyyy', { locale: it })}
                      {appointment.confirmed_time && ` alle ${appointment.confirmed_time}`}
                    </span>
                  </div>
                ) : appointment.preferred_date && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Richiesto: {format(new Date(appointment.preferred_date), 'd MMMM yyyy', { locale: it })}
                      {appointment.preferred_time && ` alle ${appointment.preferred_time}`}
                    </span>
                  </div>
                )}
                {appointment.workshop_message && (
                  <div className="p-2 bg-blue-50 rounded text-blue-700 text-sm">
                    <strong>Messaggio officina:</strong> {appointment.workshop_message}
                  </div>
                )}
              </>
            )}
          </div>

          {!needsCustomerConfirmation && (
            <div className="flex gap-2 mt-4">
              <Link to={createPageUrl('Chat') + `?appointment=${appointment.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </Link>
              {canReview && (
                <Link to={createPageUrl('WriteReview') + `?appointment=${appointment.id}`} className="flex-1">
                  <Button size="sm" className="w-full bg-yellow-500 hover:bg-yellow-600">
                    <Star className="h-4 w-4 mr-2" />
                    Recensisci
                  </Button>
                </Link>
              )}
              {reviewed && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Recensito
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">I Miei Appuntamenti</h1>

        <Tabs defaultValue="active">
          <TabsList className="mb-6">
            <TabsTrigger value="active">
              Attivi ({activeAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Passati ({pastAppointments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeAppointments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Nessun appuntamento attivo</h3>
                  <p className="text-slate-500 mb-4">
                    Non hai appuntamenti in corso o in attesa di conferma
                  </p>
                  <Link to={createPageUrl('SearchWorkshops')}>
                    <Button>Cerca un'officina</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeAppointments.map(appointment => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastAppointments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Nessun appuntamento passato</h3>
                  <p className="text-slate-500">
                    I tuoi appuntamenti completati appariranno qui
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastAppointments.map(appointment => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Propose Date Dialog */}
      <Dialog open={proposeDialog.open} onOpenChange={(open) => !open && setProposeDialog({ open: false, appointment: null, date: '', time: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proponi una nuova data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={proposeDialog.date}
                onChange={(e) => setProposeDialog(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Orario</Label>
              <Input
                type="time"
                value={proposeDialog.time}
                onChange={(e) => setProposeDialog(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProposeDialog({ open: false, appointment: null, date: '', time: '' })}>
              Annulla
            </Button>
            <Button onClick={handlePropose} disabled={proposeDateMutation.isPending}>
              {proposeDateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Proponi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}