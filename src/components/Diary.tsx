'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Plus,
  Video,
  Phone,
  MoreVertical,
  Bell,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

// Event types
type EventType = 'meeting' | 'call' | 'deadline' | 'reminder' | 'milestone';

interface DiaryEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  endTime?: string;
  type: EventType;
  location?: string;
  attendees?: string[];
  isAllDay?: boolean;
}

// Sample events
const sampleEvents: DiaryEvent[] = [
  {
    id: '1',
    title: 'Deal Team Weekly Sync',
    description: 'Weekly sync with the full deal team to review progress',
    date: '2026-02-21',
    time: '10:00',
    endTime: '11:00',
    type: 'meeting',
    location: 'Zoom',
    attendees: ['Sarah Johnson', 'Michael Chen', 'Henrik Larsson'],
  },
  {
    id: '2',
    title: 'Credit Rating Call',
    description: "Call with Moody's regarding credit rating application",
    date: '2026-02-21',
    time: '14:00',
    endTime: '15:00',
    type: 'call',
    attendees: ['Robert Anderson', 'Sarah Johnson'],
  },
  {
    id: '3',
    title: 'Legal Documentation Review',
    description: 'Review session for legal documentation with counsel',
    date: '2026-02-22',
    time: '09:00',
    endTime: '12:00',
    type: 'meeting',
    location: 'Linklaters Office, London',
    attendees: ['James Morrison', 'Anna Schmidt', 'Sarah Johnson'],
  },
  {
    id: '4',
    title: 'Term Sheet Deadline',
    description: 'Final term sheet to be completed',
    date: '2026-02-24',
    time: '17:00',
    type: 'deadline',
  },
  {
    id: '5',
    title: 'Investor Presentation Review',
    description: 'Internal review of investor presentation materials',
    date: '2026-02-25',
    time: '11:00',
    endTime: '12:30',
    type: 'meeting',
    location: 'OCF Conference Room',
    attendees: ['Sarah Johnson', 'Michael Chen', 'Emma Williams'],
  },
  {
    id: '6',
    title: 'Roadshow Kickoff',
    description: 'Start of global investor roadshow',
    date: '2026-03-01',
    time: '09:00',
    type: 'milestone',
  },
  {
    id: '7',
    title: 'Board Update Call',
    description: 'Update call with client board members',
    date: '2026-02-27',
    time: '15:00',
    endTime: '16:00',
    type: 'call',
    attendees: ['Henrik Larsson', 'Maria Svensson', 'Sarah Johnson'],
  },
  {
    id: '8',
    title: 'Due Diligence Reminder',
    description: 'Follow up on outstanding due diligence items',
    date: '2026-02-23',
    time: '09:00',
    type: 'reminder',
  },
];

const eventTypeConfig = {
  meeting: { label: 'Meeting', color: 'bg-teal-500', icon: Users },
  call: { label: 'Call', color: 'bg-blue-500', icon: Phone },
  deadline: { label: 'Deadline', color: 'bg-red-500', icon: Clock },
  reminder: { label: 'Reminder', color: 'bg-amber-500', icon: Bell },
  milestone: { label: 'Milestone', color: 'bg-purple-500', icon: Calendar },
};

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function CalendarGrid({
  currentDate,
  events,
  onDateClick,
  selectedDate,
}: {
  currentDate: Date;
  events: DiaryEvent[];
  onDateClick: (date: Date) => void;
  selectedDate: Date | null;
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Get events for specific date
  const getEventsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => e.date === dateStr);
  };

  // Check if date is today
  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  // Check if date is selected
  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    );
  };

  // Generate calendar days
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 md:h-32" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDate(day);
    const hasEvents = dayEvents.length > 0;

    days.push(
      <div
        key={day}
        onClick={() => onDateClick(new Date(year, month, day))}
        className={`h-24 md:h-32 p-1 md:p-2 border border-stone-200 dark:border-stone-700 cursor-pointer transition-colors ${
          isToday(day)
            ? 'bg-teal-50 dark:bg-teal-900/20'
            : isSelected(day)
            ? 'bg-stone-100 dark:bg-stone-700'
            : 'bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700/50'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className={`text-sm font-medium ${
              isToday(day)
                ? 'w-7 h-7 flex items-center justify-center rounded-full bg-teal-600 text-white'
                : 'text-stone-700 dark:text-stone-300'
            }`}
          >
            {day}
          </span>
          {hasEvents && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              {dayEvents.length}
            </Badge>
          )}
        </div>
        <div className="space-y-1 overflow-hidden">
          {dayEvents.slice(0, 2).map((event) => {
            const config = eventTypeConfig[event.type];
            return (
              <div
                key={event.id}
                className={`text-xs px-1.5 py-0.5 rounded truncate text-white ${config.color}`}
              >
                {event.time.slice(0, 5)} {event.title}
              </div>
            );
          })}
          {dayEvents.length > 2 && (
            <div className="text-xs text-stone-500 dark:text-stone-400 px-1">
              +{dayEvents.length - 2} more
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-0">
      {/* Day headers */}
      {daysOfWeek.map((day) => (
        <div
          key={day}
          className="h-10 flex items-center justify-center text-sm font-medium text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700"
        >
          {day}
        </div>
      ))}
      {days}
    </div>
  );
}

export function Diary() {
  const { currentProject } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [events, setEvents] = useState<DiaryEvent[]>(sampleEvents);
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<DiaryEvent>>({
    type: 'meeting',
  });

  // Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    return events.filter((e) => e.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedDate, events]);

  // Get upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const weekLater = new Date(today);
    weekLater.setDate(weekLater.getDate() + 7);

    return events
      .filter((e) => {
        const eventDate = new Date(e.date);
        return eventDate >= today && eventDate <= weekLater;
      })
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      })
      .slice(0, 5);
  }, [events]);

  // Handle new event
  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      toast.error('Please fill in all required fields');
      return;
    }

    const event: DiaryEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      description: newEvent.description || '',
      date: newEvent.date,
      time: newEvent.time,
      endTime: newEvent.endTime,
      type: newEvent.type as EventType,
      location: newEvent.location,
    };

    setEvents([...events, event]);
    setNewEvent({ type: 'meeting' });
    setNewEventOpen(false);
    toast.success('Event created successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800 dark:text-white">Diary</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            Manage your schedule and events for {currentProject?.name || 'your project'}
          </p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setNewEventOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-3 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-white min-w-[180px] text-center">
                  {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <CalendarGrid
              currentDate={currentDate}
              events={events}
              onDateClick={setSelectedDate}
              selectedDate={selectedDate}
            />
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Events */}
          <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-stone-800 dark:text-white">
                {selectedDate?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length === 0 ? (
                <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-4">
                  No events scheduled
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDateEvents.map((event) => {
                    const config = eventTypeConfig[event.type];
                    const Icon = config.icon;
                    return (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg bg-stone-50 dark:bg-stone-700/50 space-y-2"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded ${config.color}`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-stone-800 dark:text-white text-sm truncate">
                              {event.title}
                            </h4>
                            <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {event.time}
                              {event.endTime && ` - ${event.endTime}`}
                            </p>
                            {event.location && (
                              <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-stone-800 dark:text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-600" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-4">
                  No upcoming events
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => {
                    const config = eventTypeConfig[event.type];
                    return (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700/50"
                      >
                        <div className={`w-2 h-2 rounded-full ${config.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-700 dark:text-stone-300 truncate">
                            {event.title}
                          </p>
                          <p className="text-xs text-stone-500 dark:text-stone-400">
                            {new Date(event.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            at {event.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
            <CardContent className="pt-4">
              <div className="space-y-2">
                {Object.entries(eventTypeConfig).map(([type, config]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${config.color}`} />
                    <span className="text-sm text-stone-600 dark:text-stone-400">{config.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Event Dialog */}
      <Dialog open={newEventOpen} onOpenChange={setNewEventOpen}>
        <DialogContent className="bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-stone-800 dark:text-white">Create New Event</DialogTitle>
            <DialogDescription className="text-stone-500 dark:text-stone-400">
              Add a new event to your diary
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title" className="text-stone-700 dark:text-stone-300">
                Title *
              </Label>
              <Input
                id="title"
                value={newEvent.title || ''}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="mt-1"
                placeholder="Event title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="text-stone-700 dark:text-stone-300">
                  Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={newEvent.date || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="time" className="text-stone-700 dark:text-stone-300">
                  Time *
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={newEvent.time || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="type" className="text-stone-700 dark:text-stone-300">
                Type
              </Label>
              <Select
                value={newEvent.type || 'meeting'}
                onValueChange={(value) => setNewEvent({ ...newEvent, type: value as EventType })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(eventTypeConfig).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location" className="text-stone-700 dark:text-stone-300">
                Location
              </Label>
              <Input
                id="location"
                value={newEvent.location || ''}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                className="mt-1"
                placeholder="Meeting location or link"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-stone-700 dark:text-stone-300">
                Description
              </Label>
              <Textarea
                id="description"
                value={newEvent.description || ''}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="mt-1"
                placeholder="Event description"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setNewEventOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleCreateEvent}>
              Create Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
