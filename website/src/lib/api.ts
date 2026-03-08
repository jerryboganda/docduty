const fallbackApiUrl = "http://localhost:3001/api";

export function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL || fallbackApiUrl).replace(/\/+$/, "");
}

export async function apiRequest(path: string, init?: RequestInit): Promise<Response> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url, init);
}
