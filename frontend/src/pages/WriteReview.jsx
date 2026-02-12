import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Star, 
  CheckCircle,
  Loader2,
  MapPin
} from 'lucide-react';

export default function WriteReview() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const appointmentId = urlParams.get('appointment');

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: appointment } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      const appointments = await base44.entities.Appointment.filter({ id: appointmentId });
      return appointments[0];
    },
    enabled: !!appointmentId,
  });

  const { data: workshop } = useQuery({
    queryKey: ['workshop', appointment?.workshop_id],
    queryFn: async () => {
      const workshops = await base44.entities.Workshop.filter({ id: appointment.workshop_id });
      return workshops[0];
    },
    enabled: !!appointment?.workshop_id,
  });

  const createReview = useMutation({
    mutationFn: (data) => base44.entities.Review.create(data),
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) return;

    createReview.mutate({
      workshop_id: appointment.workshop_id,
      appointment_id: appointmentId,
      customer_email: user?.email,
      customer_name: user?.full_name || appointment?.customer_name,
      rating,
      title,
      comment,
      service_received: appointment?.service_requested || appointment?.diagnosis,
      status: 'pending'
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Grazie per la tua recensione!</h2>
            <p className="text-slate-600 mb-6">
              La tua recensione è in attesa di approvazione. Una volta verificata, 
              sarà visibile sul profilo di <strong>{workshop?.name}</strong>.
            </p>
            <Button 
              onClick={() => navigate(createPageUrl('MyAppointments'))}
              className="w-full"
            >
              Torna ai miei appuntamenti
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Lascia una recensione</CardTitle>
            {workshop && (
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin className="h-4 w-4" />
                {workshop.name} - {workshop.city}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div>
                <Label>La tua valutazione *</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`h-8 w-8 ${
                          star <= (hoveredRating || rating) 
                            ? 'text-yellow-500 fill-yellow-500' 
                            : 'text-slate-300'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-slate-500 mt-1">
                    {rating === 1 && 'Pessimo'}
                    {rating === 2 && 'Scarso'}
                    {rating === 3 && 'Sufficiente'}
                    {rating === 4 && 'Buono'}
                    {rating === 5 && 'Eccellente'}
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title">Titolo (opzionale)</Label>
                <Input
                  id="title"
                  placeholder="Riassumi la tua esperienza..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Comment */}
              <div>
                <Label htmlFor="comment">La tua recensione *</Label>
                <Textarea
                  id="comment"
                  placeholder="Racconta la tua esperienza con questa officina..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              {/* Service Info */}
              {(appointment?.service_requested || appointment?.diagnosis) && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">
                    <strong>Servizio ricevuto:</strong>{' '}
                    {appointment.service_requested || appointment.diagnosis}
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={rating === 0 || !comment.trim() || createReview.isPending}
              >
                {createReview.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Star className="h-5 w-5 mr-2" />
                )}
                Invia Recensione
              </Button>

              <p className="text-xs text-slate-500 text-center">
                La tua recensione sarà verificata prima della pubblicazione. 
                Non potrà essere modificata dopo l'invio.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}