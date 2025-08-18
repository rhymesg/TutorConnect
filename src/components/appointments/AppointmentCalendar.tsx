'use client';

import { useState, useMemo } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, 
         isSameMonth, isSameDay, isToday, addDays, addWeeks, addMonths, 
         subDays, subWeeks, subMonths, parseISO, getDay } from 'date-fns';
import { nb } from 'date-fns/locale';

import { LoadingSpinner } from '../ui/LoadingSpinner';
import { formatNorwegianDateTime, formatNorwegianCurrency } from '../../schemas/appointments';
import type { 
  AppointmentCalendarProps, 
  CalendarView, 
  Appointment, 
  CalendarEvent 
} from '../../types/appointments';

const VIEW_LABELS: Record<CalendarView, string> = {
  day: 'Dag',
  week: 'Uke',
  month: 'Måned',
  agenda: 'Agenda',
};

export function AppointmentCalendar({
  view,
  appointments,
  onViewChange,
  onDateChange,
  onAppointmentClick,
  onSlotClick,
  editable = false,
  loading = false,
  className = '',
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Convert appointments to calendar events
  const events = useMemo((): CalendarEvent[] => {
    return appointments.map(appointment => ({
      id: appointment.id,
      title: generateEventTitle(appointment),
      start: appointment.dateTime,
      end: new Date(new Date(appointment.dateTime).getTime() + appointment.duration * 60000).toISOString(),
      backgroundColor: getEventBackgroundColor(appointment.status),
      borderColor: getEventBorderColor(appointment.status),
      textColor: getEventTextColor(appointment.status),
      extendedProps: {
        appointment,
        type: 'appointment',
        status: appointment.status,
      },
    }));
  }, [appointments]);

  const generateEventTitle = (appointment: Appointment): string => {
    const participant = appointment.chat?.participants?.[0]?.user;
    const subject = appointment.chat?.relatedPost?.subject;
    
    let title = '';
    if (subject) {
      title += subject;
    }
    if (participant) {
      title += (title ? ' - ' : '') + participant.name;
    }
    if (!title) {
      title = 'Avtale';
    }
    
    return title;
  };

  const getEventBackgroundColor = (status: string): string => {
    switch (status) {
      case 'CONFIRMED': return '#10b981'; // green-500
      case 'PENDING': return '#f59e0b'; // amber-500
      case 'COMPLETED': return '#6b7280'; // gray-500
      case 'CANCELLED': return '#ef4444'; // red-500
      default: return '#6b7280';
    }
  };

  const getEventBorderColor = (status: string): string => {
    switch (status) {
      case 'CONFIRMED': return '#059669'; // green-600
      case 'PENDING': return '#d97706'; // amber-600
      case 'COMPLETED': return '#4b5563'; // gray-600
      case 'CANCELLED': return '#dc2626'; // red-600
      default: return '#4b5563';
    }
  };

  const getEventTextColor = (status: string): string => {
    return '#ffffff'; // Always white for good contrast
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    let newDate: Date;
    
    switch (view) {
      case 'day':
        newDate = direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1);
        break;
      case 'week':
        newDate = direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1);
        break;
      case 'month':
        newDate = direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1);
        break;
      case 'agenda':
        newDate = direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1);
        break;
      default:
        newDate = currentDate;
    }
    
    setCurrentDate(newDate);
    onDateChange(newDate.toISOString());
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateChange(today.toISOString());
  };

  const formatCurrentDateRange = (): string => {
    switch (view) {
      case 'day':
        return format(currentDate, 'EEEE d. MMMM yyyy', { locale: nb });
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'd. MMM', { locale: nb })} - ${format(weekEnd, 'd. MMM yyyy', { locale: nb })}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: nb });
      case 'agenda':
        const agendaStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const agendaEnd = endOfWeek(addWeeks(currentDate, 1), { weekStartsOn: 1 });
        return `${format(agendaStart, 'd. MMM', { locale: nb })} - ${format(agendaEnd, 'd. MMM yyyy', { locale: nb })}`;
      default:
        return '';
    }
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event => 
      isSameDay(parseISO(event.start), date)
    ).sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  };

  const getEventsForTimeSlot = (date: Date, hour: number): CalendarEvent[] => {
    return events.filter(event => {
      const eventStart = parseISO(event.start);
      const eventEnd = parseISO(event.end);
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);
      
      return (eventStart < slotEnd && eventEnd > slotStart);
    });
  };

  const handleSlotClick = (date: Date, hour?: number) => {
    if (!onSlotClick || !editable) return;
    
    const slotTime = new Date(date);
    if (hour !== undefined) {
      slotTime.setHours(hour, 0, 0, 0);
    }
    
    onSlotClick({
      start: slotTime.toISOString(),
      end: new Date(slotTime.getTime() + 3600000).toISOString(), // 1 hour later
    });
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="grid grid-cols-7 gap-px bg-neutral-200">
        {/* Weekday headers */}
        {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map(day => (
          <div key={day} className="bg-neutral-50 p-3 text-center text-sm font-medium text-neutral-700">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map(day => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[120px] bg-white p-2 cursor-pointer hover:bg-neutral-50 ${
                !isCurrentMonth ? 'bg-neutral-50 text-neutral-400' : ''
              }`}
              onClick={() => handleSlotClick(day)}
            >
              <div className={`text-sm font-medium mb-1 ${
                isCurrentDay ? 'text-brand-600' : 'text-neutral-900'
              }`}>
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className="text-xs p-1 rounded truncate cursor-pointer"
                    style={{ 
                      backgroundColor: event.backgroundColor,
                      color: event.textColor 
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick(event.extendedProps.appointment);
                    }}
                  >
                    {format(parseISO(event.start), 'HH:mm')} {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-neutral-500 font-medium">
                    +{dayEvents.length - 3} mer
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

    return (
      <div className="flex flex-col h-full">
        {/* Week header */}
        <div className="grid grid-cols-8 gap-px bg-neutral-200 sticky top-0 z-10">
          <div className="bg-white p-3"></div>
          {weekDays.map(day => (
            <div key={day.toISOString()} className="bg-white p-3 text-center">
              <div className="text-sm font-medium text-neutral-700">
                {format(day, 'EEE', { locale: nb })}
              </div>
              <div className={`text-lg font-semibold ${
                isToday(day) ? 'text-brand-600' : 'text-neutral-900'
              }`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-8 gap-px bg-neutral-200">
            {hours.map(hour => (
              <div key={hour} className="contents">
                <div className="bg-white p-3 text-right text-sm text-neutral-500">
                  {String(hour).padStart(2, '0')}:00
                </div>
                {weekDays.map(day => {
                  const slotEvents = getEventsForTimeSlot(day, hour);
                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className="bg-white min-h-[60px] p-1 border-neutral-100 cursor-pointer hover:bg-neutral-50 relative"
                      onClick={() => handleSlotClick(day, hour)}
                    >
                      {slotEvents.map(event => {
                        const eventStart = parseISO(event.start);
                        const eventDuration = event.extendedProps.appointment.duration;
                        const height = Math.min((eventDuration / 60) * 60, 180); // Max 3 hours display
                        
                        return (
                          <div
                            key={event.id}
                            className="absolute left-1 right-1 text-xs p-1 rounded truncate cursor-pointer z-10"
                            style={{ 
                              backgroundColor: event.backgroundColor,
                              color: event.textColor,
                              height: `${height}px`,
                              top: `${((eventStart.getMinutes() / 60) * 60)}px`
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAppointmentClick(event.extendedProps.appointment);
                            }}
                          >
                            <div className="font-medium">{event.title}</div>
                            <div className="opacity-90">
                              {format(eventStart, 'HH:mm')} ({eventDuration}min)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

    return (
      <div className="flex flex-col h-full">
        {/* Day header */}
        <div className="bg-white border-b border-neutral-200 p-4">
          <div className="text-center">
            <div className="text-sm font-medium text-neutral-700">
              {format(currentDate, 'EEEE', { locale: nb })}
            </div>
            <div className={`text-2xl font-bold ${
              isToday(currentDate) ? 'text-brand-600' : 'text-neutral-900'
            }`}>
              {format(currentDate, 'd. MMMM yyyy', { locale: nb })}
            </div>
          </div>
        </div>

        {/* Time slots */}
        <div className="flex-1 overflow-y-auto">
          {hours.map(hour => {
            const slotEvents = getEventsForTimeSlot(currentDate, hour);
            return (
              <div
                key={hour}
                className="flex min-h-[80px] border-b border-neutral-100 cursor-pointer hover:bg-neutral-50"
                onClick={() => handleSlotClick(currentDate, hour)}
              >
                <div className="w-20 p-4 text-right text-sm text-neutral-500 border-r border-neutral-100">
                  {String(hour).padStart(2, '0')}:00
                </div>
                <div className="flex-1 p-2 relative">
                  {slotEvents.map(event => {
                    const eventStart = parseISO(event.start);
                    const eventDuration = event.extendedProps.appointment.duration;
                    const height = Math.min((eventDuration / 60) * 80, 240); // Max 3 hours display
                    
                    return (
                      <div
                        key={event.id}
                        className="absolute left-2 right-2 p-3 rounded-lg cursor-pointer shadow-sm"
                        style={{ 
                          backgroundColor: event.backgroundColor,
                          color: event.textColor,
                          height: `${height}px`,
                          top: `${((eventStart.getMinutes() / 60) * 80)}px`
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick(event.extendedProps.appointment);
                        }}
                      >
                        <div className="font-medium text-sm">{event.title}</div>
                        <div className="text-xs opacity-90 mt-1">
                          {format(eventStart, 'HH:mm')} - {format(parseISO(event.end), 'HH:mm')}
                        </div>
                        <div className="text-xs opacity-80 mt-1">
                          {event.extendedProps.appointment.location}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const agendaEvents = events
      .filter(event => {
        const eventDate = parseISO(event.start);
        return eventDate >= weekStart && eventDate <= addWeeks(weekStart, 2);
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    const groupedEvents = agendaEvents.reduce((groups, event) => {
      const dateKey = format(parseISO(event.start), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
      return groups;
    }, {} as Record<string, CalendarEvent[]>);

    return (
      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([dateKey, dayEvents]) => {
          const date = parseISO(dateKey);
          return (
            <div key={dateKey} className="bg-white rounded-lg border border-neutral-200">
              <div className="p-4 border-b border-neutral-100">
                <h3 className="text-lg font-semibold text-neutral-900">
                  {format(date, 'EEEE d. MMMM', { locale: nb })}
                </h3>
                <p className="text-sm text-neutral-600">
                  {dayEvents.length} avtale{dayEvents.length !== 1 ? 'r' : ''}
                </p>
              </div>
              
              <div className="divide-y divide-neutral-100">
                {dayEvents.map(event => {
                  const appointment = event.extendedProps.appointment;
                  const eventStart = parseISO(event.start);
                  const eventEnd = parseISO(event.end);
                  const participant = appointment.chat?.participants?.[0]?.user;
                  
                  return (
                    <div
                      key={event.id}
                      className="p-4 hover:bg-neutral-50 cursor-pointer"
                      onClick={() => onAppointmentClick(appointment)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: event.backgroundColor }}
                            />
                            <h4 className="font-medium text-neutral-900">{event.title}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              appointment.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {appointment.status === 'CONFIRMED' ? 'Bekreftet' :
                               appointment.status === 'PENDING' ? 'Venter' :
                               appointment.status === 'COMPLETED' ? 'Fullført' :
                               'Kansellert'}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-sm text-neutral-600">
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-2" />
                              {format(eventStart, 'HH:mm')} - {format(eventEnd, 'HH:mm')}
                              ({appointment.duration} min)
                            </div>
                            
                            <div className="flex items-center">
                              <MapPinIcon className="h-4 w-4 mr-2" />
                              {appointment.location}
                            </div>
                            
                            {participant && (
                              <div className="flex items-center">
                                <UserIcon className="h-4 w-4 mr-2" />
                                {participant.name}
                              </div>
                            )}
                            
                            {appointment.price && (
                              <div className="font-medium text-neutral-900">
                                {formatNorwegianCurrency(appointment.price)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {Object.keys(groupedEvents).length === 0 && (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Ingen avtaler</h3>
            <p className="text-neutral-600">
              Du har ingen avtaler i den valgte perioden.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 ${className}`}>
      {/* Calendar header */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-neutral-900">
              {formatCurrentDateRange()}
            </h2>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => navigateDate('prev')}
                className="p-1 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded"
              >
                I dag
              </button>
              <button
                onClick={() => navigateDate('next')}
                className="p-1 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* View selector */}
            <div className="flex bg-neutral-100 rounded-lg p-1">
              {(Object.keys(VIEW_LABELS) as CalendarView[]).map(viewType => (
                <button
                  key={viewType}
                  onClick={() => onViewChange(viewType)}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                    view === viewType
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {VIEW_LABELS[viewType]}
                </button>
              ))}
            </div>

            {/* Add appointment button */}
            {editable && onSlotClick && (
              <button
                onClick={() => handleSlotClick(currentDate)}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Ny avtale
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Calendar content */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
            <LoadingSpinner size="lg" />
          </div>
        )}
        
        <div className="min-h-[400px]">
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
          {view === 'agenda' && renderAgendaView()}
        </div>
      </div>
    </div>
  );
}

export default AppointmentCalendar;