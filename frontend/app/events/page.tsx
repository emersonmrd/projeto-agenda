"use client";

import Calendar from "@/components/Calendar";
import EventCard from "@/components/EventCard";
import EventForm from "@/components/EventForm";
import { authService } from "@/lib/auth";
import { eventsService } from "@/lib/events";
import type { CreateEventData, Event } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
  const [currentConflicts, setCurrentConflicts] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }

    setUser(authService.getUser());
    loadEvents();
  }, [router]);

  const loadEvents = async () => {
    try {
      const data = await eventsService.getAll();
      setEvents(data);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkConflicts = (newStart: Date, newEnd: Date, excludeId?: string) => {
    const conflicts = events.filter((event) => {
      if (excludeId && event.id === excludeId) return false;

      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);

      return (
        (newStart >= eventStart && newStart < eventEnd) ||
        (newEnd > eventStart && newEnd <= eventEnd) ||
        (newStart <= eventStart && newEnd >= eventEnd)
      );
    });

    return conflicts;
  };

  const handleDatesChange = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      const conflicts = checkConflicts(
        new Date(startDate),
        new Date(endDate),
        editingEvent?.id,
      );
      setCurrentConflicts(conflicts);
    }
  };

  const handleCreate = async (data: CreateEventData) => {
    setFormLoading(true);
    try {
      await eventsService.create(data);
      await loadEvents();
      setShowForm(false);
      setCurrentConflicts([]);
      setSelectedDate(null);
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      alert("Erro ao criar evento");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: CreateEventData) => {
    if (!editingEvent) return;
    setFormLoading(true);
    try {
      await eventsService.update(editingEvent.id, data);
      await loadEvents();
      setShowForm(false);
      setEditingEvent(null);
      setCurrentConflicts([]);
      setSelectedDate(null);
    } catch (error) {
      console.error("Erro ao atualizar evento:", error);
      alert("Erro ao atualizar evento");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await eventsService.delete(id);
      await loadEvents();
      // Se estava editando o evento deletado, fechar o formulário
      if (editingEvent?.id === id) {
        setShowForm(false);
        setEditingEvent(null);
        setCurrentConflicts([]);
        setSelectedDate(null);
      }
    } catch (error) {
      console.error("Erro ao deletar evento:", error);
      alert("Erro ao deletar evento");
    }
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setEditingEvent(null);

    // Criar nova data sem problema de timezone
    const clickedDate = new Date(
      slotInfo.start.getFullYear(),
      slotInfo.start.getMonth(),
      slotInfo.start.getDate(),
      12, // meio-dia para evitar problemas de timezone
      0,
      0,
    );

    setSelectedDate(clickedDate);
    setCurrentConflicts([]);

    // Verificar conflitos para o horário selecionado
    const conflicts = checkConflicts(slotInfo.start, slotInfo.end);
    setCurrentConflicts(conflicts);

    setShowForm(true);
  };

  const handleNewEvent = () => {
    setEditingEvent(null);
    setSelectedDate(null); // Usa a data atual como padrão
    setShowForm(true);

    // Detectar conflitos com horário padrão (09:00 - 10:00)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const startDefault = new Date(`${year}-${month}-${day}T09:00:00`);
    const endDefault = new Date(`${year}-${month}-${day}T10:00:00`);

    const conflicts = checkConflicts(startDefault, endDefault);
    setCurrentConflicts(conflicts);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setSelectedDate(null); // A data virá do evento sendo editado
    setCurrentConflicts([]);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEvent(null);
    setCurrentConflicts([]);
    setSelectedDate(null);
  };

  const handleLogout = () => {
    authService.logout();
  };

  // Handler para deletar do calendário
  const handleDeleteFromCalendar = async (eventId: string) => {
    await handleDelete(eventId);
  };

  // Handler para editar do calendário
  const handleEditFromCalendar = (event: Event) => {
    handleEdit(event);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Minha Agenda</h1>
            <div className="flex items-center gap-4">
              {user && (
                <span className="text-sm text-gray-600">Olá, {user.name}</span>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Eventos ({events.length})
            </h2>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === "calendar"
                    ? "bg-cyan-700 text-white"
                    : "bg-cyan-500 text-white hover:bg-cyan-700"
                }`}
              >
                Calendário
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === "list"
                    ? "bg-cyan-700 text-white"
                    : "bg-cyan-500 text-white hover:bg-cyan-700"
                }`}
              >
                Lista
              </button>
            </div>
          </div>

          <button
            onClick={handleNewEvent}
            className="bg-cyan-500 text-white px-4 py-2 rounded-md hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
          >
            + Novo Evento
          </button>
        </div>

        {viewMode === "calendar" ? (
          <Calendar
            events={events}
            onSelectEvent={handleEdit}
            onSelectSlot={handleSelectSlot}
            onDeleteEvent={handleDeleteFromCalendar}
            onEditEvent={handleEditFromCalendar}
          />
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Nenhum evento cadastrado</p>
            <p className="text-gray-400 text-sm mt-2">
              Clique em "Novo Evento" para criar seu primeiro evento
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <EventForm
          event={editingEvent}
          onSubmit={editingEvent ? handleUpdate : handleCreate}
          onCancel={handleCloseForm}
          loading={formLoading}
          conflicts={currentConflicts}
          onDatesChange={handleDatesChange}
          onDelete={handleDelete}
          onEdit={handleEdit}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}
