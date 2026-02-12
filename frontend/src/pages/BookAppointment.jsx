import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import TimeSlotPicker from '@/components/booking/TimeSlotPicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar as CalendarIcon, 
  Car, 
  User, 
  Phone, 
  Mail,
  CheckCircle,
  Loader2,
  MapPin,
  Star
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function BookAppointment() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const workshopId = urlParams.get('workshop');
  const initialDiagnosis = urlParams.get('diagnosis') || '';
  const aiChatHistory = JSON.parse(sessionStorage.getItem('aiChatHistory') || 'null');
  const vehicleInfo = JSON.parse(sessionStorage.getItem('vehicleInfo') || 'null');
  const serviceCategory = sessionStorage.getItem('serviceCategory') || '';

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    car_brand: vehicleInfo?.marca || '',
    car_model: vehicleInfo?.modello || '',
    car_year: vehicleInfo?.anno || '',
    car_plate: vehicleInfo?.targa || '',
    diagnosis: initialDiagnosis,
    service_requested: serviceCategory,
    notes: '',
    preferred_date: null,
    preferred_time: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: workshop, isLoading: loadingWorkshop } = useQuery({
    queryKey: ['workshop', workshopId],
    queryFn: async () => {
      const workshops = await base44.entities.Workshop.filter({ id: workshopId });
      return workshops[0];
    },
    enabled: !!workshopId,
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customer_name: user.full_name || '',
        customer_email: user.email || ''
      }));
    }
  }, [user]);

  const createAppointment = useMutation({
    mutationFn: (data) => base44.entities.Appointment.create(data),
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createAppointment.mutate({
      workshop_id: workshopId,
      customer_email: user?.email,
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      car_brand: formData.car_brand,
      car_model: formData.car_model,
      car_year: formData.car_year ? parseInt(formData.car_year) : null,
      car_plate: formData.car_plate,
      diagnosis: formData.diagnosis,
      ai_chat_history: aiChatHistory,
      service_requested: formData.service_requested,
      notes: formData.notes,
      preferred_date: formData.preferred_date ? format(formData.preferred_date, 'yyyy-MM-dd') : null,
      preferred_time: formData.preferred_time,
      status: 'pending'
    });
    // Clear session storage after booking
    sessionStorage.removeItem('aiChatHistory');
    sessionStorage.removeItem('vehicleInfo');
    sessionStorage.removeItem('diagnosisSummary');
    sessionStorage.removeItem('serviceCategory');
  };

  if (loadingWorkshop) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-32 w-full rounded-lg mb-4" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Richiesta Inviata!</h2>
            <p className="text-slate-600 mb-6">
              La tua richiesta di appuntamento è stata inviata a <strong>{workshop?.name}</strong>. 
              Riceverai una conferma non appena l'officina avrà verificato la disponibilità.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => navigate(createPageUrl('MyAppointments'))}
                className="w-full"
              >
                I miei appuntamenti
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate(createPageUrl('Home'))}
                className="w-full"
              >
                Torna alla home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Workshop Info */}
        {workshop && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                  {workshop.logo ? (
                    <img src={workshop.logo} alt={workshop.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Car className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-lg">{workshop.name}</h2>
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    {workshop.city}
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    {workshop.average_rating?.toFixed(1) || '-'} ({workshop.total_reviews || 0} recensioni)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking Form */}
        <Card>
          <CardHeader>
            <CardTitle>Richiedi Appuntamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <User className="h-5 w-5 text-slate-400" />
                  I tuoi dati
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input
                      id="name"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefono *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Car Info */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Car className="h-5 w-5 text-slate-400" />
                  La tua auto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="brand">Marca</Label>
                    <Input
                      id="brand"
                      placeholder="es. Fiat"
                      value={formData.car_brand}
                      onChange={(e) => setFormData({...formData, car_brand: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Modello</Label>
                    <Input
                      id="model"
                      placeholder="es. Punto"
                      value={formData.car_model}
                      onChange={(e) => setFormData({...formData, car_model: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Anno</Label>
                    <Input
                      id="year"
                      type="number"
                      placeholder="es. 2018"
                      value={formData.car_year}
                      onChange={(e) => setFormData({...formData, car_year: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="plate">Targa (opzionale)</Label>
                  <Input
                    id="plate"
                    placeholder="es. AB123CD"
                    value={formData.car_plate}
                    onChange={(e) => setFormData({...formData, car_plate: e.target.value})}
                  />
                </div>
              </div>

              {/* Service Info */}
              <div className="space-y-4">
                <h3 className="font-medium">Dettagli richiesta</h3>
                
                {initialDiagnosis && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Label className="text-blue-800">Diagnosi AI</Label>
                    <p className="text-sm text-blue-700 mt-1">{initialDiagnosis}</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="service">Servizio richiesto</Label>
                  <Select
                    value={formData.service_requested}
                    onValueChange={(value) => setFormData({...formData, service_requested: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona servizio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Meccanica generale">Meccanica generale</SelectItem>
                      <SelectItem value="Elettrauto">Elettrauto</SelectItem>
                      <SelectItem value="Carrozzeria">Carrozzeria</SelectItem>
                      <SelectItem value="Gommista">Gommista</SelectItem>
                      <SelectItem value="Tagliando">Tagliando</SelectItem>
                      <SelectItem value="Revisione">Revisione</SelectItem>
                      <SelectItem value="Climatizzatore">Climatizzatore</SelectItem>
                      <SelectItem value="Freni">Freni</SelectItem>
                      <SelectItem value="Altro">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!initialDiagnosis && (
                  <div>
                    <Label htmlFor="diagnosis">Descrivi il problema</Label>
                    <Textarea
                      id="diagnosis"
                      placeholder="Descrivi il problema o il servizio di cui hai bisogno..."
                      value={formData.diagnosis}
                      onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                      rows={3}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Note aggiuntive</Label>
                  <Textarea
                    id="notes"
                    placeholder="Altre informazioni utili per l'officina..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={2}
                  />
                </div>
              </div>

              {/* Date/Time */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-slate-400" />
                  Data e Orario Preferito
                </h3>
                <div className="flex-1">
                  <Label>Seleziona data</Label>
                  <Calendar
                    mode="single"
                    selected={formData.preferred_date}
                    onSelect={(date) => setFormData({...formData, preferred_date: date, preferred_time: ''})}
                    disabled={(date) => date < new Date()}
                    locale={it}
                    className="rounded-md border"
                  />
                </div>
                {formData.preferred_date && (
                  <div>
                    <Label>Seleziona orario</Label>
                    <TimeSlotPicker
                      workshopId={workshopId}
                      selectedDate={formData.preferred_date}
                      selectedTime={formData.preferred_time}
                      onSelectSlot={(time) => setFormData({...formData, preferred_time: time})}
                    />
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={createAppointment.isPending}
              >
                {createAppointment.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : null}
                Invia Richiesta
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}