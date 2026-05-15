import axios, { AxiosInstance, AxiosError } from 'axios';

// Service tokens are 24h; refresh 5 minutes before expiry to avoid edge cases
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

class ApiService {
  private readonly client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.API_BASE_URL ?? 'http://localhost:3000',
    });
  }

  async authenticate(): Promise<void> {
    const clientId = process.env.WORKER_CLIENT_ID;
    const clientSecret = process.env.WORKER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('WORKER_CLIENT_ID and WORKER_CLIENT_SECRET must be set in .env');
    }

    const res = await this.client.post<{ accessToken: string }>('/auth/token', {
      clientId,
      clientSecret,
    });

    this.accessToken = res.data.accessToken;
    this.tokenExpiresAt = Date.now() + TOKEN_TTL_MS - TOKEN_REFRESH_BUFFER_MS;
  }

  private async ensureAuthenticated(): Promise<string> {
    if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
      await this.authenticate();
    }
    return this.accessToken!;
  }

  private authHeader(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  async get<T>(path: string): Promise<T> {
    const token = await this.ensureAuthenticated();
    const res = await this.client.get<T>(path, { headers: this.authHeader(token) });
    return res.data;
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    const token = await this.ensureAuthenticated();
    const res = await this.client.post<T>(path, data, { headers: this.authHeader(token) });
    return res.data;
  }

  // Public endpoint — no auth needed
  async health(): Promise<{ status: string; timestamp: string }> {
    const res = await this.client.get<{ status: string; timestamp: string }>('/health');
    return res.data;
  }
}

export const api = new ApiService();
