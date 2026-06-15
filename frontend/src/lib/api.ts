const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:3333`;
  }
  return "http://localhost:3333";
};
const API_URL = getApiUrl();

class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

class ApiClient {
  private accessToken: string | null = null;
  // BUG-11: Controle de refresh automático
  private isRefreshing = false;
  private refreshQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
  }> = [];

  setToken(token: string | null) {
    this.accessToken = token;
  }

  getToken() {
    return this.accessToken;
  }

  // BUG-11: Tenta renovar o token usando o refresh token armazenado
  private async refreshAccessToken(): Promise<string> {
    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem("@Bartime:refreshToken")
        : null;

    if (!refreshToken) {
      throw new ApiError("Sessão expirada", 401);
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Refresh falhou — limpar tudo e redirecionar
      this.clearAuthAndRedirect();
      throw new ApiError("Sessão expirada. Faça login novamente.", 401);
    }

    const data = await response.json();
    const newToken = data.accessToken || data.token;

    this.accessToken = newToken;
    localStorage.setItem("@Bartime:token", newToken);
    if (data.refreshToken) {
      localStorage.setItem("@Bartime:refreshToken", data.refreshToken);
    }

    return newToken;
  }

  private clearAuthAndRedirect() {
    this.accessToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("@Bartime:token");
      localStorage.removeItem("@Bartime:refreshToken");
      localStorage.removeItem("@Bartime:professional");
      localStorage.removeItem("@Bartime:tenant");
      // Redirecionar para login apenas se não estiver já na página de auth
      if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
        window.location.href = "/login";
      }
    }
  }

  // BUG-11: Gerencia fila de refresh para evitar múltiplas chamadas simultâneas
  private async handleTokenRefresh(): Promise<string> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;
    try {
      const newToken = await this.refreshAccessToken();
      this.refreshQueue.forEach(({ resolve }) => resolve(newToken));
      this.refreshQueue = [];
      return newToken;
    } catch (error) {
      this.refreshQueue.forEach(({ reject }) => reject(error));
      this.refreshQueue = [];
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  private async handleResponse<T>(response: Response, retryFn?: () => Promise<Response>): Promise<T> {
    // BUG-11: Se 401 e temos um retry function, tentar renovar o token
    if (response.status === 401 && retryFn) {
      try {
        const newToken = await this.handleTokenRefresh();
        this.accessToken = newToken;
        const retryResponse = await retryFn();
        return this.handleResponse<T>(retryResponse); // sem retry na segunda tentativa
      } catch {
        throw new ApiError("Sessão expirada. Faça login novamente.", 401);
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Erro de conexão com o servidor",
        statusCode: response.status,
      }));

      // Redirecionar para a página de planos se a assinatura/teste expirou
      if (response.status === 403 && errorData.action === "subscribe") {
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/dashboard/planos")) {
          window.location.href = "/dashboard/planos";
        }
      }

      throw new ApiError(errorData.error || errorData.message || "Erro desconhecido", errorData.statusCode || response.status);
    }
    
    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    
    return response.blob() as unknown as T;
  }

  protected getHeaders(isFormData = false): HeadersInit {
    const headers: HeadersInit = {};

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const token = this.accessToken || (typeof window !== "undefined" ? localStorage.getItem("@Bartime:token") : null);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${API_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.append(key, value);
        }
      });
    }

    const makeRequest = () =>
      fetch(url.toString(), {
        method: "GET",
        headers: this.getHeaders(),
        credentials: "include",
      });

    const response = await makeRequest();
    return this.handleResponse<T>(response, makeRequest);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const isFormData = data instanceof FormData || (typeof data === "object" && data !== null && "append" in data);

    const makeRequest = () =>
      fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: this.getHeaders(isFormData),
        credentials: "include",
        body: isFormData ? (data as any) : data ? JSON.stringify(data) : undefined,
      });

    const response = await makeRequest();
    return this.handleResponse<T>(response, makeRequest);
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const isFormData = data instanceof FormData || (typeof data === "object" && data !== null && "append" in data);

    const makeRequest = () =>
      fetch(`${API_URL}${endpoint}`, {
        method: "PATCH",
        headers: this.getHeaders(isFormData),
        credentials: "include",
        body: isFormData ? (data as any) : data ? JSON.stringify(data) : undefined,
      });

    const response = await makeRequest();
    return this.handleResponse<T>(response, makeRequest);
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const isFormData = data instanceof FormData || (typeof data === "object" && data !== null && "append" in data);

    const makeRequest = () =>
      fetch(`${API_URL}${endpoint}`, {
        method: "PUT",
        headers: this.getHeaders(isFormData),
        credentials: "include",
        body: isFormData ? (data as any) : data ? JSON.stringify(data) : undefined,
      });

    const response = await makeRequest();
    return this.handleResponse<T>(response, makeRequest);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const makeRequest = () =>
      fetch(`${API_URL}${endpoint}`, {
        method: "DELETE",
        headers: this.getHeaders(),
        credentials: "include",
      });

    const response = await makeRequest();
    return this.handleResponse<T>(response, makeRequest);
  }

  async download(endpoint: string, params?: Record<string, string>): Promise<Blob> {
    const url = new URL(`${API_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.getHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      throw new ApiError("Erro ao baixar arquivo", response.status);
    }

    return response.blob();
  }
}

export const api = new ApiClient();

class ClientApiClient extends ApiClient {
  protected override getHeaders(isFormData = false): HeadersInit {
    const headers: HeadersInit = {};

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    let token = null;
    if (typeof window !== "undefined") {
      const match = window.location.pathname.match(/^\/book\/([^\/]+)/);
      if (match) {
        token = localStorage.getItem(`@Bartime:clientToken_${match[1]}`);
      }
      if (!token) {
        token = localStorage.getItem("@Bartime:clientToken");
      }
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }
}

export const clientApi = new ClientApiClient();
export { ApiError };

