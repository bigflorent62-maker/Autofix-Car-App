import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function WeeklyCalendar({ workshopId }) {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  );

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['weeklyAppointments', workshopId, currentWeekStart],
    queryFn: async () => {
      const allAppointments = await base44.entities.Appointment.filter({
        workshop_id: workshopId
      });
      return allAppointments.filter(a => 
        a.status !== 'cancelled' && 
        a.status !== 'declined' && 
        a.confirmed_date
      );
    },
    enabled: !!workshopId
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  
  // Generate time slots from 8:00 to 18:30 in 30-minute intervals
  const timeSlots = [];
  for (let hour = 8; hour <= 18; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 18) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }

  const getAppointmentForSlot = (date, time) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.find(apt => {
      if (apt.confirmed_date !== dateStr) return false;
      if (!apt.confirmed_time) return false;
      
      // Check if time matches (we'll match 30-min slots)
      const [aptHour, aptMin] = apt.confirmed_time.split(':').map(Number);
      const [slotHour, slotMin] = time.split(':').map(Number);
      
      // Match if appointment time is within this 30-min slot
      return aptHour === slotHour && Math.abs(aptMin - slotMin) < 30;
    });
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Calendario Settimanale
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
              Oggi
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-slate-500">
          {format(weekDays[0], 'd MMM', { locale: it })} - {format(weekDays[6], 'd MMM yyyy', { locale: it })}
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header with days */}
            <div className="grid grid-cols-8 gap-px bg-slate-200 border border-slate-200 rounded-t-lg overflow-hidden">
              <div className="bg-white p-2 text-xs font-medium text-slate-500">Orario</div>
              {weekDays.map((day, idx) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={idx}
                    className={cn(
                      "bg-white p-2 text-center",
                      isToday && "bg-blue-50"
                    )}
                  >
                    <div className={cn(
                      "text-xs font-medium",
                      isToday ? "text-blue-600" : "text-slate-600"
                    )}>
                      {format(day, 'EEE', { locale: it })}
                    </div>
                    <div className={cn(
                      "text-lg font-semibold",
                      isToday ? "text-blue-600" : "text-slate-900"
                    )}>
                      {format(day, 'd', { locale: it })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time slots */}
            <div className="grid grid-cols-8 gap-px bg-slate-200 border-x border-b border-slate-200 rounded-b-lg overflow-hidden">
              {timeSlots.map((time, timeIdx) => (
                <React.Fragment key={time}>
                  {/* Time label */}
                  <div className="bg-slate-50 p-2 text-xs text-slate-600 font-medium flex items-center">
                    {time}
                  </div>
                  
                  {/* Day cells */}
                  {weekDays.map((day, dayIdx) => {
                    const appointment = getAppointmentForSlot(day, time);
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <div
                        key={`${timeIdx}-${dayIdx}`}
                        className={cn(
                          "bg-white p-1 min-h-[40px] relative",
                          isToday && "bg-blue-50/30"
                        )}
                      >
                        {appointment && (
                          <div
                            className={cn(
                              "text-xs p-1 rounded h-full",
                              appointment.status === 'pending' && "bg-yellow-100 text-yellow-800 border border-yellow-300",
                              appointment.status === 'confirmed' && "bg-green-100 text-green-800 border border-green-300",
                              appointment.status === 'completed' && "bg-slate-100 text-slate-600 border border-slate-300"
                            )}
                          >
                            <div className="font-medium truncate">
                              {appointment.customer_name}
                            </div>
                            <div className="text-[10px] truncate">
                              {appointment.car_brand} {appointment.car_model}
                            </div>
                            {appointment.awaiting_confirmation_from === 'workshop' && (
                              <Badge className="text-[9px] h-4 mt-0.5 bg-orange-500">
                                Cambio richiesto
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
            <span className="text-slate-600">In attesa</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
            <span className="text-slate-600">Confermato</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-100 border border-slate-300" />
            <span className="text-slate-600">Completato</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}