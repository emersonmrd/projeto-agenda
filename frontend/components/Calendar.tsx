"use client";

import type { Event } from "@/lib/types";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCallback, useState } from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  SlotInfo,
  View,
} from "react-big-calendar";

// @ts-ignore
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  "pt-BR": ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Event;
}

interface CalendarProps {
  events: Event[];
  onSelectEvent: (event: Event) => void;
  onSelectSlot: (slotInfo: { start: Date; end: Date }) => void;
  onDeleteEvent?: (eventId: string) => void;
  onEditEvent?: (event: Event) => void;
}

const EVENT_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

export default function Calendar({
  events,
  onSelectEvent,
  onSelectSlot,
  onDeleteEvent,
  onEditEvent,
}: CalendarProps) {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>("month");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    event: Event;
  } | null>(null);

  const calendarEvents: CalendarEvent[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: new Date(event.startDate),
    end: new Date(event.endDate),
    resource: event,
  }));

  const eventStyleGetter = (event: CalendarEvent) => {
    const colorIndex =
      calendarEvents.findIndex((e) => e.id === event.id) % EVENT_COLORS.length;
    const backgroundColor = EVENT_COLORS[colorIndex];

    return {
      style: {
        backgroundColor,
        borderRadius: "5px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  const onNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const onView = useCallback((newView: View) => {
    setView(newView);
  }, []);

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setDate(newDate);
    setShowDatePicker(false);
  };

  const handleEventClick = (event: CalendarEvent, e: React.SyntheticEvent) => {
    const nativeEvent = e.nativeEvent as MouseEvent;

    // Se for clique com botão direito, não fazer nada aqui
    if (nativeEvent.button === 2) {
      return;
    }

    // Clique normal - selecionar evento
    onSelectEvent(event.resource);
  };

  const handleContextMenu = (event: CalendarEvent, e: React.SyntheticEvent) => {
    e.preventDefault();
    const nativeEvent = e.nativeEvent as MouseEvent;

    setContextMenu({
      x: nativeEvent.clientX,
      y: nativeEvent.clientY,
      event: event.resource,
    });
  };

  const handleDeleteEvent = () => {
    if (contextMenu && onDeleteEvent) {
      onDeleteEvent(contextMenu.event.id);
      setContextMenu(null);
    }
  };

  const handleEditEvent = () => {
    if (contextMenu && onEditEvent) {
      onEditEvent(contextMenu.event);
      setContextMenu(null);
    }
  };

  // Fechar menu ao clicar fora
  const handleClickOutside = () => {
    setContextMenu(null);
  };

  const currentMonth = date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const dateInputValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="bg-white rounded-lg shadow" onClick={handleClickOutside}>
      {/* Header customizado com seletor de data */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDate(new Date())}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Hoje
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 2H4C2.89543 2 2 2.89543 2 4V12C2 13.1046 2.89543 14 4 14H12C13.1046 14 14 13.1046 14 12V4C14 2.89543 13.1046 2 12 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M11 1V3M5 1V3M2 6H14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Escolher mês/ano
            </button>

            {showDatePicker && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50">
                <input
                  type="month"
                  value={dateInputValue}
                  onChange={handleDatePickerChange}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            )}
          </div>

          <span className="text-lg font-semibold text-gray-900 capitalize">
            {currentMonth}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setView("month")}
            className={`px-3 py-1 text-sm rounded ${
              view === "month"
                ? "bg-cyan-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Mês
          </button>
          <button
            onClick={() => setView("week")}
            className={`px-3 py-1 text-sm rounded ${
              view === "week"
                ? "bg-cyan-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setView("day")}
            className={`px-3 py-1 text-sm rounded ${
              view === "day"
                ? "bg-cyan-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Dia
          </button>
        </div>
      </div>

      {/* Calendário */}
      <div className="p-4" style={{ height: "650px" }}>
        <BigCalendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          culture="pt-BR"
          date={date}
          view={view}
          onNavigate={onNavigate}
          onView={onView}
          toolbar={false}
          messages={{
            next: "Próximo",
            previous: "Anterior",
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia",
            agenda: "Agenda",
            date: "Data",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "Não há eventos neste período",
            showMore: (total: number) => `+ ${total} mais`,
          }}
          onSelectEvent={handleEventClick}
          onSelectSlot={(slotInfo: SlotInfo) =>
            onSelectSlot({ start: slotInfo.start, end: slotInfo.end })
          }
          selectable
          eventPropGetter={eventStyleGetter}
          views={["month", "week", "day", "agenda"]}
          components={{
            event: ({ event }: { event: CalendarEvent }) => (
              <div
                onContextMenu={(e) => handleContextMenu(event, e)}
                className="cursor-pointer"
              >
                {event.title}
              </div>
            ),
          }}
        />
      </div>

      {/* Menu de Contexto */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[60]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleEditEvent}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M11.333 2A1.886 1.886 0 0 1 14 4.667l-9 9-3.667 1 1-3.667 9-9Z"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Editar
          </button>
          <button
            onClick={handleDeleteEvent}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334Z"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}
