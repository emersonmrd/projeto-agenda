import { api } from "./api";
import type { AuthResponse, LoginData, RegisterData, User } from "./types";

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", data);
    this.saveAuth(response.data);
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/register", data);
    this.saveAuth(response.data);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>("/auth/me");
    return response.data;
  },

  saveAuth(data: AuthResponse) {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  },

  getToken(): string | null {
    return localStorage.getItem("token");
  },

  getUser(): User | null {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
