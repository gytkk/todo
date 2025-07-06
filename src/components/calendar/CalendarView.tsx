"use client";

import { Calendar, dateFnsLocalizer, SlotInfo } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarEvent } from '@/types';
import { memo, useMemo, useCallback } from 'react';
import { SimpleCalendarSkeleton } from './SimpleCalendarSkeleton';
import { NoSSR } from '../NoSSR';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { ko },
});

interface CalendarViewProps {
  events: CalendarEvent[];
  onSelectSlot: (slotInfo: SlotInfo) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onCalendarClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

function CalendarViewComponent({ 
  events, 
  onSelectSlot, 
  onSelectEvent, 
  onCalendarClick 
}: CalendarViewProps) {
  // Validate and sanitize events before passing to calendar
  const validatedEvents = useMemo(() => {
    return events.filter(event => {
      // Ensure start and end are valid Date objects
      const startValid = event.start instanceof Date && !isNaN(event.start.getTime());
      const endValid = event.end instanceof Date && !isNaN(event.end.getTime());
      
      if (!startValid || !endValid) {
        console.warn('Invalid event date found:', event);
        return false;
      }
      
      return true;
    });
  }, [events]);

  const eventPropGetter = useCallback((event: CalendarEvent) => ({
    style: {
      backgroundColor: event.resource?.completed ? "#d1d5db" : "#f3f4f6",
      color: event.resource?.completed ? "#6b7280" : "#374151",
      borderRadius: "6px",
      opacity: event.resource?.completed ? 0.8 : 1,
      border: "1px solid #e5e7eb",
    },
  }), []);

  const messages = useMemo(() => ({
    next: "다음",
    previous: "이전",
    today: "오늘",
    month: "월",
    week: "주",
    day: "일",
    agenda: "일정",
    date: "날짜",
    time: "시간",
    event: "이벤트",
    noEventsInRange: "이 기간에 일정이 없습니다.",
    showMore: (count: number) => `+${count} 더보기`,
  }), []);

  const views = useMemo(() => ["month", "week", "day"], []);

  return (
    <div className="h-full p-4 bg-white">
      <NoSSR fallback={<SimpleCalendarSkeleton />}>
        <div className="h-full hydrated" onClick={onCalendarClick}>
          <Calendar
            localizer={localizer}
            events={validatedEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            culture="ko"
            onSelectSlot={onSelectSlot}
            onSelectEvent={onSelectEvent}
            selectable={true}
            popup={true}
            eventPropGetter={eventPropGetter}
            views={views}
            defaultView="month"
            messages={messages}
          />
        </div>
      </NoSSR>
    </div>
  );
}

export const CalendarView = memo(CalendarViewComponent);