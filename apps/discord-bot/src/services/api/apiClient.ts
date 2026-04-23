import axios, { AxiosInstance, AxiosError } from 'axios';
import { Result, ApiResultError, Problem } from '../../models/result';

export class ApiClient {
    private readonly http: AxiosInstance;

    constructor(baseURL: string, apiKey?: string) {
        this.http = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
            timeout: 10_000,
        });

        // Normalise all errors into Result.fail so callers never have to catch
        this.http.interceptors.response.use(
            response => response,
            (err: AxiosError<{ message?: string; code?: string; problems?: Problem[] }>) => {
                const status   = err.response?.status ?? 0;
                const message  = err.response?.data?.message ?? err.message;
                const code     = err.response?.data?.code ?? `HTTP_${status}`;
                const problems = err.response?.data?.problems ?? null;
                return Promise.reject(new ApiResultError(code, `HTTP ${status}`, message, problems));
            },
        );
    }

    async get<T>(path: string): Promise<Result<T>> {
        return Result.wrap(async () => {
            const { data } = await this.http.get<T>(path);
            return Result.ok(data);
        });
    }

    async post<T>(path: string, body: unknown): Promise<Result<T>> {
        return Result.wrap(async () => {
            const { data } = await this.http.post<T>(path, body);
            return Result.ok(data);
        });
    }

    async put<T>(path: string, body: unknown): Promise<Result<T>> {
        return Result.wrap(async () => {
            const { data } = await this.http.put<T>(path, body);
            return Result.ok(data);
        });
    }

    async patch<T>(path: string, body: unknown): Promise<Result<T>> {
        return Result.wrap(async () => {
            const { data } = await this.http.patch<T>(path, body);
            return Result.ok(data);
        });
    }

    async delete<T>(path: string): Promise<Result<T>> {
        return Result.wrap(async () => {
            const { data } = await this.http.delete<T>(path);
            return Result.ok(data);
        });
    }
}

// Singleton — import this everywhere in the bot
export const apiClient = new ApiClient(
    process.env.API_BASE_URL ?? 'http://localhost:3000',
    process.env.API_KEY,
);
