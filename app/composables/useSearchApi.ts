type SearchRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Record<string, unknown>
  body?: Record<string, unknown> | unknown[] | string | null
}

export function useSearchApi() {
  const { getAuthHeaders } = useAuthSession();

  async function request<T>(
    path: string,
    options: SearchRequestOptions = {},
  ): Promise<T> {
    const cleanPath = path.replace(/^\//, "");

    return $fetch<T>(`/api/search/${cleanPath}`, {
      method: options.method || "GET",
      query: options.query,
      body: options.body,
      headers: getAuthHeaders(),
      credentials: "include",
    });
  }

  return { request };
}
