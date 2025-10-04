// src/lib/api.ts
import axios, { AxiosError, AxiosRequestConfig } from "axios";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Reusable axios instance
export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,                  
    headers: { "Content-Type": "application/json" },
});

/** GET helper that returns typed data T (res.data) */
export async function apiGet<T>(
    path: string,
    config?: AxiosRequestConfig
): Promise<T> {
    try {
        // console.log(path);
        const res = await api.get<T>(path, config);
        return res.data;
    } catch (err) {
        const e = err as AxiosError;
        const status = e.response?.status ?? "";
        const statusText = e.response?.statusText ?? e.message;
        throw new Error(`${status} ${statusText}`.trim());
    }
}

export async function apiPost<T, B = unknown>(
  path: string,
  body: B,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const res = await api.post<T>(path, body, config);
    return res.data;
  } catch (err) {
    const e = err as AxiosError;
    const status = e.response?.status ?? "";
    const statusText = e.response?.statusText ?? e.message;
    throw new Error(`${status} ${statusText}`.trim());
  }
}

// new helper when you need HTTP status too
export async function apiPostWithStatus<T, B = unknown>(
  path: string,
  body: B,
  config?: AxiosRequestConfig
): Promise<{ data: T; status: number }> {
  const res = await api.post<T>(path, body, config);
  return { data: res.data, status: res.status };
}

export async function apiPatch<T, B = unknown>(
  path: string,
  body: B,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const res = await api.patch<T>(path, body, config);
    return res.data;
  } catch (err) {
    const e = err as AxiosError;
    const status = e.response?.status ?? "";
    const statusText = e.response?.statusText ?? e.message;
    throw new Error(`${status} ${statusText}`.trim());
  }
}


export async function apiDelete<T = unknown>(
  path: string,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const res = await api.delete<T>(path, config);
    return res.data;
  } catch (err) {
    const e = err as AxiosError<any>;
    const status = e.response?.status;
    const statusText = e.response?.statusText;
    const serverMsg =
      (e.response?.data && (e.response.data.message || e.response.data.error)) ??
      undefined;

    const parts = [
      status ? String(status) : undefined,
      statusText,
      serverMsg ?? e.message,
    ].filter(Boolean);

    throw new Error(parts.join(" - "));
  }
}