import axios, { AxiosInstance, AxiosError } from 'axios';
import { Result, ApiResultError, Problem } from '../../models/result';

const TOKEN_TTL_MS            = 24 * 60 * 60 * 1000;
const TOKEN_REFRESH_BUFFER_MS =  5 * 60 * 1000;

export class ApiClient {
    private readonly http: AxiosInstance;
    private accessToken: string | null = null;
    private tokenExpiresAt: number = 0;

    constructor(baseURL: string) {
        this.http = axios.create({
            baseURL,
            headers: { 'Content-Type': 'application/json' },
            timeout: 10_000,
        });

        this.http.interceptors.response.use(
            response => response,
            (err: AxiosError<{ message?: string; code?: string; problems?: Problem[] }>) => {
                const status   = err.response?.status ?? 0;
                const message  = err.response?.data?.message ?? err.message;
                const code     = err.response?.data?.code ?? `HTTP_${status}`;
                const problems = err.response?.data?.problems ?? null;
                const method   = err.config?.method?.toUpperCase() ?? '?';
                const url      = err.config?.url ?? '?';
                console.error(`[API] ${method} ${url} → ${status}: ${message}`);
                return Promise.reject(new ApiResultError(code, `HTTP ${status}`, message, problems));
            },
        );
    }

    async authenticate(): Promise<void> {
        const clientId     = process.env.BOT_CLIENT_ID?.trim();
        const clientSecret = process.env.BOT_CLIENT_SECRET?.trim();
        if (!clientId || !clientSecret) throw new Error('BOT_CLIENT_ID and BOT_CLIENT_SECRET must be set in .env');
        const res = await this.http.post<{ accessToken: string }>('/auth/token', { clientId, clientSecret });
        this.accessToken    = res.data.accessToken;
        this.tokenExpiresAt = Date.now() + TOKEN_TTL_MS - TOKEN_REFRESH_BUFFER_MS;
    }

    private async ensureAuthenticated(): Promise<string> {
        if (!this.accessToken || Date.now() >= this.tokenExpiresAt) await this.authenticate();
        return this.accessToken!;
    }

    private authHeader(token: string) {
        return { Authorization: `Bearer ${token}` };
    }

    async get<T>(path: string, params?: Record<string, string>): Promise<Result<T>> {
        return Result.wrap(async () => {
            const token = await this.ensureAuthenticated();
            const { data } = await this.http.get<T>(path, { params, headers: this.authHeader(token) });
            return Result.ok(data);
        });
    }

    async post<T>(path: string, body: unknown, timeoutMs?: number): Promise<Result<T>> {
        return Result.wrap(async () => {
            const token = await this.ensureAuthenticated();
            const { data } = await this.http.post<T>(path, body, { headers: this.authHeader(token), ...(timeoutMs !== undefined && { timeout: timeoutMs }) });
            return Result.ok(data);
        });
    }

    async put<T>(path: string, body: unknown): Promise<Result<T>> {
        return Result.wrap(async () => {
            const token = await this.ensureAuthenticated();
            const { data } = await this.http.put<T>(path, body, { headers: this.authHeader(token) });
            return Result.ok(data);
        });
    }

    async patch<T>(path: string, body: unknown): Promise<Result<T>> {
        return Result.wrap(async () => {
            const token = await this.ensureAuthenticated();
            const { data } = await this.http.patch<T>(path, body, { headers: this.authHeader(token) });
            return Result.ok(data);
        });
    }

    async delete<T>(path: string): Promise<Result<T>> {
        return Result.wrap(async () => {
            const token = await this.ensureAuthenticated();
            const { data } = await this.http.delete<T>(path, { headers: this.authHeader(token) });
            return Result.ok(data);
        });
    }
}

// Singleton — import this everywhere in the bot
export const apiClient = new ApiClient(
    process.env.API_BASE_URL ?? 'http://localhost:3000',
);
