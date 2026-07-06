export default defineEventHandler(async (event) => {
  const segments = getRouterParam(event, 'path')
  if (!segments) {
    throw createError({ statusCode: 400, statusMessage: 'Missing API path' })
  }

  const method = event.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD'
  const body = method === 'GET' || method === 'HEAD'
    ? undefined
    : await readBody(event).catch(() => undefined)

  return searchFetch(
    `/${segments}`,
    {
      method,
      query: getQuery(event),
      body: body as SearchFetchOptions["body"],
    },
    event,
  );
})
