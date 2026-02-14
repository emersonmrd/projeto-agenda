import type {
  CreateEventData,
  Event,
  TimelineSegment,
  TimelineSlot,
} from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

interface EventFormProps {
  event?: Event | null;
  onSubmit: (data: CreateEventData) => void;
  onCancel: () => void;
  loading: boolean;
  conflicts?: Event[];
  onDatesChange?: (startDate: string, endDate: string) => void;
  onDelete?: (eventId: string) => void;
  onEdit?: (event: Event) => void;
  selectedDate?: Date | null;
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

export default function EventForm({
  event,
  onSubmit,
  onCancel,
  loading,
  conflicts = [],
  onDatesChange,
  onDelete,
  onEdit,
  selectedDate,
}: EventFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    event: Event;
  } | null>(null);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");

      const start = new Date(event.startDate);
      const end = new Date(event.endDate);

      const year = start.getFullYear();
      const month = String(start.getMonth() + 1).padStart(2, "0");
      const day = String(start.getDate()).padStart(2, "0");

      const startHour = String(start.getHours()).padStart(2, "0");
      const startMin = String(start.getMinutes()).padStart(2, "0");
      const endHour = String(end.getHours()).padStart(2, "0");
      const endMin = String(end.getMinutes()).padStart(2, "0");

      setStartDate(`${year}-${month}-${day}`);
      setStartTime(`${startHour}:${startMin}`);
      setEndTime(`${endHour}:${endMin}`);
    } else {
      // Usar selectedDate se disponível, senão usar hoje
      const dateToUse = selectedDate || new Date();
      const year = dateToUse.getFullYear();
      const month = String(dateToUse.getMonth() + 1).padStart(2, "0");
      const day = String(dateToUse.getDate()).padStart(2, "0");

      setStartDate(`${year}-${month}-${day}`);
      setStartTime("09:00");
      setEndTime("10:00");
    }
  }, [event, selectedDate]);

  // Detectar conflitos quando as datas mudarem
  useEffect(() => {
    if (startDate && startTime && endTime && onDatesChange) {
      onDatesChange(`${startDate}T${startTime}`, `${startDate}T${endTime}`);
    }
  }, [startDate, startTime, endTime]);

  // Fechar menu de contexto ao clicar fora
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  const handleDateChange = (value: string) => {
    setStartDate(value);
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
  };

  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação de horário
    if (startTime >= endTime) {
      alert("O horário final deve ser posterior ao horário inicial");
      return;
    }

    const startISO = `${startDate}T${startTime}:00-03:00`;
    const endISO = `${startDate}T${endTime}:00-03:00`;

    const payload = {
      title: title.trim() || "Sem assunto", // Se vazio, usa "Sem assunto"
      description: description || undefined,
      startDate: startISO,
      endDate: endISO,
    };

    onSubmit(payload);
  };

  const handleContextMenu = (e: React.MouseEvent, conflict: Event) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      event: conflict,
    });
  };

  const handleDeleteEvent = () => {
    if (contextMenu && onDelete) {
      onDelete(contextMenu.event.id);
      setContextMenu(null);
    }
  };

  const handleEditEvent = () => {
    if (contextMenu && onEdit) {
      onEdit(contextMenu.event);
      setContextMenu(null);
    }
  };

  // Função para encontrar o próximo horário vago
  const findNextAvailableSlot = () => {
    if (conflicts.length === 0) return;

    const currentStartMinutes =
      parseInt(startTime.split(":")[0]) * 60 +
      parseInt(startTime.split(":")[1]);
    const currentEndMinutes =
      parseInt(endTime.split(":")[0]) * 60 + parseInt(endTime.split(":")[1]);
    const duration = currentEndMinutes - currentStartMinutes;

    // Criar array de minutos ocupados
    const busyMinutes = new Set<number>();
    conflicts.forEach((conflict) => {
      const conflictDate = new Date(conflict.startDate)
        .toISOString()
        .slice(0, 10);
      if (conflictDate === startDate) {
        const start = new Date(conflict.startDate);
        const end = new Date(conflict.endDate);
        const startMin = start.getHours() * 60 + start.getMinutes();
        const endMin = end.getHours() * 60 + end.getMinutes();

        for (let i = startMin; i < endMin; i++) {
          busyMinutes.add(i);
        }
      }
    });

    // Procurar próximo slot vago com a mesma duração
    let searchStart = currentEndMinutes; // Começa depois do horário atual
    const maxMinutes = 24 * 60; // Até 23:59

    while (searchStart + duration <= maxMinutes) {
      let slotIsFree = true;

      // Verificar se todos os minutos do slot estão livres
      for (let i = searchStart; i < searchStart + duration; i++) {
        if (busyMinutes.has(i)) {
          slotIsFree = false;
          searchStart = i + 1; // Pular para depois do conflito
          break;
        }
      }

      if (slotIsFree) {
        // Encontrou um slot vago!
        const newStartHour = String(Math.floor(searchStart / 60)).padStart(
          2,
          "0",
        );
        const newStartMin = String(searchStart % 60).padStart(2, "0");
        const newEndHour = String(
          Math.floor((searchStart + duration) / 60),
        ).padStart(2, "0");
        const newEndMin = String((searchStart + duration) % 60).padStart(
          2,
          "0",
        );

        setStartTime(`${newStartHour}:${newStartMin}`);
        setEndTime(`${newEndHour}:${newEndMin}`);
        return;
      }
    }

    // Se não encontrar no mesmo dia, não faz nada (ou pode avisar o usuário)
    alert("Não há mais horários vagos disponíveis neste dia");
  };

  const getMiniCalendarDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }

    return days;
  };

  // Gerar timeline do dia (00:00 - 23:59)
  const generateDayTimeline = (): TimelineSegment[] => {
    const timeline: TimelineSlot[] = [];
    const totalMinutes = 24 * 60; // 1440 minutos

    // Primeiro, criar toda a timeline vazia
    for (let i = 0; i < totalMinutes; i++) {
      timeline.push({ type: "free", color: "#e5e7eb" });
    }

    // Marcar eventos existentes
    conflicts.forEach((conflict, index) => {
      const start = new Date(conflict.startDate);
      const end = new Date(conflict.endDate);

      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const endMinutes = end.getHours() * 60 + end.getMinutes();

      const color = EVENT_COLORS[index % EVENT_COLORS.length];

      for (let i = startMinutes; i < endMinutes; i++) {
        timeline[i] = { type: "busy", color, event: conflict };
      }
    });

    // Agrupar minutos consecutivos da mesma cor
    const segments: TimelineSegment[] = [];
    let currentSegment: TimelineSegment = {
      start: 0,
      end: 0,
      color: timeline[0].color,
      event: timeline[0].event,
    };

    for (let i = 1; i < timeline.length; i++) {
      if (timeline[i].color === currentSegment.color) {
        currentSegment.end = i;
      } else {
        segments.push(currentSegment);
        currentSegment = {
          start: i,
          end: i,
          color: timeline[i].color,
          event: timeline[i].event,
        };
      }
    }
    segments.push(currentSegment);

    return segments;
  };

  const miniDays = getMiniCalendarDays();

  // Otimizar com useMemo para evitar recalcular a timeline a cada render
  const dayTimeline = useMemo(() => {
    return conflicts.length > 0 ? generateDayTimeline() : [];
  }, [conflicts]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do evento"
              className="text-xl font-medium w-full border-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-400"
            />
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="border-y py-4">
              <div className="flex justify-between items-center mb-4">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    today.setHours(12, 0, 0, 0);
                    handleDateChange(today.toISOString().slice(0, 10));
                  }}
                  className="text-cyan-500 hover:text-cyan-600 text-sm"
                >
                  ← hoje
                </button>

                <div className="flex gap-4">
                  {miniDays.map((day, index) => {
                    const isSelected =
                      day.toISOString().slice(0, 10) === startDate;
                    const hasConflict = conflicts.some((c) => {
                      const conflictDate = new Date(c.startDate)
                        .toISOString()
                        .slice(0, 10);
                      return conflictDate === day.toISOString().slice(0, 10);
                    });

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() =>
                          handleDateChange(day.toISOString().slice(0, 10))
                        }
                        className="relative flex flex-col items-center"
                      >
                        <span className="text-xs text-gray-500 mb-1">
                          {day
                            .toLocaleDateString("pt-BR", { weekday: "short" })
                            .slice(0, 3)}
                        </span>
                        <div
                          className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                            isSelected
                              ? "bg-cyan-500 text-white"
                              : "hover:bg-gray-100 text-gray-700"
                          }`}
                        >
                          {day.getDate()}
                        </div>
                        {hasConflict && !isSelected && (
                          <div className="absolute bottom-0 w-8 h-6 bg-gradient-to-r from-red-300 via-orange-300 to-red-300 rounded-b opacity-50" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {conflicts.length > 0 && (
                  <button
                    type="button"
                    onClick={findNextAvailableSlot}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400 text-white rounded-full font-medium text-sm hover:bg-cyan-500 transition-colors"
                  >
                    <span>HORÁRIO VAGO</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M6 12L10 8L6 4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Timeline do dia */}
              {dayTimeline.length > 0 && (
                <div className="space-y-2">
                  <div className="flex h-8 rounded overflow-hidden">
                    {dayTimeline.map((segment, index) => {
                      const width =
                        ((segment.end - segment.start + 1) / (24 * 60)) * 100;
                      return (
                        <div
                          key={index}
                          style={{
                            width: `${width}%`,
                            backgroundColor: segment.color,
                          }}
                          className="h-full"
                          title={segment.event?.title}
                        />
                      );
                    })}
                  </div>

                  {/* Legenda dos eventos */}
                  {conflicts.map((conflict, index) => {
                    const conflictStart = new Date(conflict.startDate);
                    const conflictEnd = new Date(conflict.endDate);
                    const startHour = String(conflictStart.getHours()).padStart(
                      2,
                      "0",
                    );
                    const startMin = String(
                      conflictStart.getMinutes(),
                    ).padStart(2, "0");
                    const endHour = String(conflictEnd.getHours()).padStart(
                      2,
                      "0",
                    );
                    const endMin = String(conflictEnd.getMinutes()).padStart(
                      2,
                      "0",
                    );
                    const color = EVENT_COLORS[index % EVENT_COLORS.length];

                    return (
                      <div
                        key={conflict.id}
                        className="flex items-center gap-2 text-sm"
                        onContextMenu={(e) => handleContextMenu(e, conflict)}
                      >
                        <div
                          className="flex-1 h-8 rounded px-3 flex items-center text-white font-medium cursor-context-menu"
                          style={{ backgroundColor: color }}
                        >
                          {conflict.title}
                        </div>
                        <span className="text-gray-600 text-xs whitespace-nowrap">
                          {startHour}:{startMin} - {endHour}:{endMin}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Adicionar descrição..."
              />
            </div>
          </div>

          <div className="p-6 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-cyan-400 text-white rounded-md font-medium hover:bg-cyan-500"
            >
              {loading ? "SALVANDO..." : event ? "SALVAR" : "CRIAR"}
            </button>
          </div>
        </form>
      </div>

      {/* Menu de Contexto */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[60]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
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
