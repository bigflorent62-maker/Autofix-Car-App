import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ZoomIn, ZoomOut, Settings } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

const DEFAULT_COLORS = [
  { id: 1, label: 'Meccanica', bg: 'bg-red-200', border: 'border-red-400', text: 'text-red-900' },
  { id: 2, label: 'Elettrico', bg: 'bg-amber-200', border: 'border-amber-400', text: 'text-amber-900' },
  { id: 3, label: 'Gomme', bg: 'bg-slate-400', border: 'border-slate-600', text: 'text-slate-900' },
  { id: 4, label: 'Carrozzeria', bg: 'bg-purple-200', border: 'border-purple-400', text: 'text-purple-900' },
  { id: 5, label: 'Altro', bg: 'bg-teal-200', border: 'border-teal-400', text: 'text-teal-900' }
];

export default function OutlookCalendar({ appointments = [] }) {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { locale: it, weekStartsOn: 1 }));
  const [resizingAppointment, setResizingAppointment] = useState(null);
  const [appointmentHeights, setAppointmentHeights] = useState({});
  const [columnWidths, setColumnWidths] = useState({});
  const [resizingColumn, setResizingColumn] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [customColors, setCustomColors] = useState(() => {
    const saved = localStorage.getItem('calendarColors');
    return saved ? JSON.parse(saved) : DEFAULT_COLORS;
  });
  const [appointmentColors, setAppointmentColors] = useState(() => {
    const saved = localStorage.getItem('appointmentColors');
    return saved ? JSON.parse(saved) : {};
  });
  const [showColorSettings, setShowColorSettings] = useState(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);
  const hourHeight = 80 * zoom;
  const defaultColumnWidth = 140 * zoom;

  const goToPreviousWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));
  const goToNextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { locale: it, weekStartsOn: 1 }));
  const handleZoomIn = () => setZoom(Math.min(zoom + 0.2, 2));
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.2, 0.6));

  const getAppointmentsForDay = (day) => {
    return appointments.filter(apt => {
      const aptDate = apt.confirmed_date || apt.preferred_date;
      if (!aptDate) return false;
      try {
        return isSameDay(parseISO(aptDate), day);
      } catch {
        return false;
      }
    });
  };

  const getTimePosition = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = (hours - 8) * 60 + minutes;
    return (totalMinutes / 60) * hourHeight;
  };

  const getColumnWidth = (dayIndex) => {
    return columnWidths[dayIndex] || defaultColumnWidth;
  };

  const handleMouseDown = (e, aptId, currentHeight) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingAppointment(aptId);
    startYRef.current = e.clientY;
    startHeightRef.current = currentHeight;
  };

  const handleColumnMouseDown = (e, dayIndex, currentWidth) => {
    e.preventDefault();
    setResizingColumn(dayIndex);
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
  };

  const handleMouseMove = (e) => {
    if (resizingAppointment) {
      const deltaY = e.clientY - startYRef.current;
      const newHeight = Math.max(40, startHeightRef.current + deltaY);
      setAppointmentHeights(prev => ({
        ...prev,
        [resizingAppointment]: newHeight
      }));
    }
    
    if (resizingColumn !== null) {
      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.max(80, startWidthRef.current + deltaX);
      setColumnWidths(prev => ({
        ...prev,
        [resizingColumn]: newWidth
      }));
    }
  };

  const handleMouseUp = () => {
    setResizingAppointment(null);
    setResizingColumn(null);
  };

  React.useEffect(() => {
    if (resizingAppointment || resizingColumn !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingAppointment, resizingColumn]);

  const getAppointmentHeight = (aptId) => {
    return appointmentHeights[aptId] || (hourHeight * 0.95);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-200 border-yellow-400 text-yellow-900';
      case 'confirmed': return 'bg-blue-200 border-blue-400 text-blue-900';
      case 'completed': return 'bg-green-200 border-green-400 text-green-900';
      default: return 'bg-slate-200 border-slate-400 text-slate-900';
    }
  };

  const getAppointmentColor = (aptId) => {
    const colorId = appointmentColors[aptId];
    if (!colorId) return null;
    const color = customColors.find(c => c.id === colorId);
    return color ? `${color.bg} ${color.border} ${color.text}` : null;
  };

  const handleColorChange = (aptId, colorId) => {
    const updated = { ...appointmentColors, [aptId]: colorId };
    setAppointmentColors(updated);
    localStorage.setItem('appointmentColors', JSON.stringify(updated));
  };

  const handleLabelChange = (colorId, newLabel) => {
    const updated = customColors.map(c => 
      c.id === colorId ? { ...c, label: newLabel } : c
    );
    setCustomColors(updated);
    localStorage.setItem('calendarColors', JSON.stringify(updated));
  };

  const isToday = (day) => isSameDay(day, new Date());

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendario Appuntamenti
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowColorSettings(true)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium px-2">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Oggi
            </Button>
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[200px] text-center">
              {format(currentWeekStart, 'd MMM', { locale: it })} - {format(addDays(currentWeekStart, 6), 'd MMM yyyy', { locale: it })}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-auto" style={{ maxHeight: '70vh' }}>
          {/* Header with days */}
          <div className="flex border-b bg-slate-50 sticky top-0 z-30">
            <div className="p-2 text-xs font-medium text-slate-500 w-16 flex-shrink-0 border-r"></div>
            {weekDays.map((day, i) => (
              <div 
                key={i} 
                className={`p-2 text-center border-l relative ${isToday(day) ? 'bg-blue-50' : ''}`}
                style={{ width: `${getColumnWidth(i)}px`, minWidth: '80px' }}
              >
                <div className="text-xs font-medium text-slate-500">
                  {format(day, 'EEE', { locale: it })}
                </div>
                <div className={`font-semibold ${isToday(day) ? 'text-blue-600' : 'text-slate-700'}`} style={{ fontSize: `${12 * zoom}px` }}>
                  {format(day, 'd')}
                </div>
                <div 
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 active:bg-blue-500"
                  onMouseDown={(e) => handleColumnMouseDown(e, i, getColumnWidth(i))}
                />
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="flex relative">
            {/* Time column */}
            <div className="border-r bg-slate-50 w-16 flex-shrink-0">
              {hours.map((hour) => (
                <div key={hour} className="border-b p-1 text-slate-500 text-right pr-2" style={{ height: `${hourHeight}px`, fontSize: `${10 * zoom}px` }}>
                  {hour}:00
                </div>
              ))}
            </div>

            {/* Days columns */}
            {weekDays.map((day, dayIndex) => {
              const dayAppointments = getAppointmentsForDay(day);
              const colWidth = getColumnWidth(dayIndex);
              
              return (
                <div key={dayIndex} className="border-l relative" style={{ width: `${colWidth}px`, minWidth: '80px' }}>
                  {/* Hour lines */}
                  {hours.map((hour) => (
                    <div key={hour} className="border-b" style={{ height: `${hourHeight}px` }}></div>
                  ))}

                  {/* Appointments */}
                  {dayAppointments.map((apt) => {
                    const time = apt.confirmed_time || apt.preferred_time;
                    const topPosition = getTimePosition(time);
                    const height = getAppointmentHeight(apt.id);
                    const diagnosis = apt.diagnosis || '';
                    
                    // Calculate adaptive font sizes based on height
                    const baseScale = Math.min(1, height / 76);
                    const titleSize = Math.max(8, 10 * zoom * baseScale);
                    const carSize = Math.max(7, 9 * zoom * baseScale);
                    const diagnosisSize = Math.max(6, 8 * zoom * baseScale);
                    const badgeSize = Math.max(6, 7 * zoom * baseScale);
                    const spacing = Math.max(1, 2 * zoom * baseScale);
                    const padding = Math.max(2, 4 * zoom * baseScale);
                    
                    const showBadge = height > 45;
                    const showDiagnosis = height > 35 && diagnosis;
                    
                    const customColor = getAppointmentColor(apt.id);
                    const colorClass = customColor || getStatusColor(apt.status);
                    
                    return (
                      <div
                        key={apt.id}
                        className={`absolute left-1 right-1 rounded border-l-4 shadow-sm cursor-pointer overflow-hidden flex flex-col group ${colorClass}`}
                        style={{
                          top: `${topPosition}px`,
                          height: `${height}px`,
                          zIndex: resizingAppointment === apt.id ? 20 : 10,
                          padding: `${padding}px`
                        }}
                      >
                        {/* Color picker dropdown */}
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                          <select
                            value={appointmentColors[apt.id] || ''}
                            onChange={(e) => handleColorChange(apt.id, e.target.value ? Number(e.target.value) : null)}
                            className="text-xs px-1 py-0.5 rounded border bg-white"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">Default</option>
                            {customColors.map(color => (
                              <option key={color.id} value={color.id}>{color.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="font-semibold truncate" style={{ fontSize: `${titleSize}px`, lineHeight: 1.2 }}>
                          {time} - {apt.customer_name}
                        </div>
                        <div className="truncate" style={{ fontSize: `${carSize}px`, lineHeight: 1.2, marginTop: `${spacing}px` }}>
                          {apt.car_brand} {apt.car_model}
                        </div>
                        {showDiagnosis && (
                          <div className="italic opacity-75 flex-1 overflow-hidden" style={{ 
                            fontSize: `${diagnosisSize}px`, 
                            lineHeight: 1.3, 
                            marginTop: `${spacing}px`,
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            hyphens: 'auto'
                          }}>
                            {diagnosis}
                          </div>
                        )}
                        {showBadge && (
                          <Badge className="self-start flex-shrink-0" variant="outline" style={{ fontSize: `${badgeSize}px`, padding: `${padding / 2}px ${padding}px`, marginTop: `${spacing}px` }}>
                            {apt.status === 'pending' ? 'Attesa' :
                             apt.status === 'confirmed' ? 'Confermato' : 'OK'}
                          </Badge>
                        )}
                        <div 
                          className="absolute bottom-0 left-0 right-0 cursor-ns-resize hover:bg-black/10 rounded-b z-40"
                          style={{ height: `${Math.max(6, 8 * zoom)}px` }}
                          onMouseDown={(e) => handleMouseDown(e, apt.id, height)}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 space-y-2">
          <div className="text-xs font-semibold text-slate-500 mb-2">Stati:</div>
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-200 border border-yellow-400"></div>
              <span>In attesa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-200 border border-blue-400"></div>
              <span>Confermato</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-200 border border-green-400"></div>
              <span>Completato</span>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-500 mt-3 mb-2">Categorie personalizzate:</div>
          <div className="flex items-center gap-4 text-xs flex-wrap">
            {customColors.map(color => (
              <div key={color.id} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${color.bg} border ${color.border}`}></div>
                <span>{color.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      {/* Color Settings Dialog */}
      <Dialog open={showColorSettings} onOpenChange={setShowColorSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Personalizza Categorie Colori</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {customColors.map((color) => (
              <div key={color.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded ${color.bg} border-2 ${color.border} flex-shrink-0`}></div>
                <Input
                  value={color.label}
                  onChange={(e) => handleLabelChange(color.id, e.target.value)}
                  placeholder="Nome categoria"
                  className="flex-1"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowColorSettings(false)}>Chiudi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}