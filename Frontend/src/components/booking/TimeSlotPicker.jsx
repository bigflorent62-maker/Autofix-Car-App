import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TimeSlotPicker({ workshopId, selectedDate, onSelectSlot, selectedTime }) {
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['workshopAppointments', workshopId, selectedDate],
    queryFn: async () => {
      if (!workshopId || !selectedDate) return [];
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const allAppointments = await base44.entities.Appointment.filter({
        workshop_id: workshopId,
        confirmed_date: formattedDate
      });
      return allAppointments.filter(a => a.status !== 'cancelled' && a.status !== 'declined');
    },
    enabled: !!workshopId && !!selectedDate
  });

  const isSlotBooked = (time) => {
    if (!appointments) return false;
    return appointments.some(apt => apt.confirmed_time === time);
  };

  const getSlotStatus = (time) => {
    if (isSlotBooked(time)) return 'booked';
    return 'available';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-slate-200 bg-white" />
          <span className="text-slate-600">Disponibile</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-slate-600">Selezionato</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-slate-600">Occupato</span>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {timeSlots.map((time) => {
          const status = getSlotStatus(time);
          const isSelected = selectedTime === time;
          const isBooked = status === 'booked';

          return (
            <Button
              key={time}
              variant="outline"
              onClick={() => !isBooked && onSelectSlot(time)}
              disabled={isBooked}
              className={cn(
                "h-12",
                isSelected && !isBooked && "bg-green-500 text-white hover:bg-green-600 border-green-500",
                isBooked && "bg-red-500 text-white cursor-not-allowed opacity-60",
                !isSelected && !isBooked && "hover:bg-slate-50"
              )}
            >
              <Clock className="h-4 w-4 mr-2" />
              {time}
            </Button>
          );
        })}
      </div>

      {selectedDate && (
        <p className="text-sm text-slate-600">
          Data selezionata: <strong>{format(selectedDate, 'dd/MM/yyyy')}</strong>
        </p>
      )}
    </div>
  );
}