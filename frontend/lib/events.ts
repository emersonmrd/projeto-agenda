import { api } from "./api";
import type { CreateEventData, Event, UpdateEventData } from "./types";

export const eventsService = {
  async getAll(): Promise<Event[]> {
    const response = await api.get<Event[]>("/events");
    return response.data;
  },

  async getOne(id: string): Promise<Event> {
    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
  },

  async create(data: CreateEventData): Promise<Event> {
    const response = await api.post<Event>("/events", data);
    return response.data;
  },

  async update(id: string, data: UpdateEventData): Promise<Event> {
    const response = await api.patch<Event>(`/events/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/events/${id}`);
  },
};
