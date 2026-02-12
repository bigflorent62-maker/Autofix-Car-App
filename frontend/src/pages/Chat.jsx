import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Send, 
  ArrowLeft,
  Car,
  Calendar,
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function Chat() {
  const urlParams = new URLSearchParams(window.location.search);
  const appointmentId = urlParams.get('appointment');
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

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

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', appointmentId],
    queryFn: () => base44.entities.Message.filter({ appointment_id: appointmentId }),
    enabled: !!appointmentId,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const sendMessage = useMutation({
    mutationFn: (content) => base44.entities.Message.create({
      appointment_id: appointmentId,
      sender_email: user?.email,
      sender_type: appointment?.customer_email === user?.email ? 'customer' : 'workshop',
      content
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', appointmentId] });
      setInput('');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage.mutate(input.trim());
  };

  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.created_date) - new Date(b.created_date)
  );

  const isCustomer = appointment?.customer_email === user?.email;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl(isCustomer ? 'MyAppointments' : 'WorkshopDashboard')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h2 className="font-semibold">
              {isCustomer ? workshop?.name : appointment?.customer_name}
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Car className="h-4 w-4" />
              {appointment?.car_brand} {appointment?.car_model}
              {appointment?.confirmed_date && (
                <>
                  <span>•</span>
                  <Calendar className="h-4 w-4" />
                  {format(new Date(appointment.confirmed_date), 'd MMM', { locale: it })}
                </>
              )}
            </div>
          </div>
          <Badge variant={
            appointment?.status === 'confirmed' ? 'default' :
            appointment?.status === 'pending' ? 'secondary' : 'outline'
          }>
            {appointment?.status === 'confirmed' ? 'Confermato' :
             appointment?.status === 'pending' ? 'In attesa' :
             appointment?.status === 'completed' ? 'Completato' : appointment?.status}
          </Badge>
        </div>
      </div>

      {/* Appointment Info */}
      {appointment?.diagnosis && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
          <div className="max-w-2xl mx-auto">
            <p className="text-sm text-blue-800">
              <strong>Problema:</strong> {appointment.diagnosis}
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-3/4" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>Nessun messaggio ancora.</p>
              <p className="text-sm">Inizia la conversazione!</p>
            </div>
          ) : (
            sortedMessages.map((message) => {
              const isOwn = message.sender_email === user?.email;
              return (
                <div 
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${isOwn ? 'order-2' : ''}`}>
                    <Card className={isOwn ? 'bg-blue-600 text-white' : 'bg-white'}>
                      <CardContent className="p-3">
                        <p className="text-sm">{message.content}</p>
                      </CardContent>
                    </Card>
                    <p className={`text-xs text-slate-400 mt-1 ${isOwn ? 'text-right' : ''}`}>
                      {format(new Date(message.created_date), 'HH:mm', { locale: it })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Scrivi un messaggio..."
            className="flex-1"
          />
          <Button 
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}