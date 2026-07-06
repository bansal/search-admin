import type { H3Event } from "h3";

export type SearchFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";
  query?: Record<string, unknown>;
  body?: Record<string, unknown> | unknown[] | string | null;
};

export async function searchFetch<T>(
  path: string,
  options: SearchFetchOptions = {},
  event?: H3Event,
): Promise<T> {
  const { url, masterKey } = resolveAuthCredentials(event);
  const baseUrl = url.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  try {
    return await $fetch<T>(`${baseUrl}${normalizedPath}`, {
      method: options.method || "GET",
      query: options.query,
      body: options.body,
      headers: {
        Authorization: `Bearer ${masterKey}`,
        "Content-Type": "application/json",
      },
    });
  } catch (error: unknown) {
    const err = error as {
      statusCode?: number;
      status?: number;
      statusMessage?: string;
      message?: string;
      data?: unknown;
    };

    throw createError({
      statusCode: err.statusCode || err.status || 500,
      statusMessage:
        err.statusMessage || err.message || "Search provider request failed",
      data: err.data,
    });
  }
}
