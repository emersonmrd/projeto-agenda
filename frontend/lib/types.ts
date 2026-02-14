export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface TimelineSlot {
  type: "free" | "busy";
  color: string;
  event?: Event;
}

export interface TimelineSegment {
  start: number;
  end: number;
  color: string;
  event?: Event;
}
