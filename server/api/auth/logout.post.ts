export default defineEventHandler((event) => {
  clearAuthSessionCookie(event);

  return { ok: true };
});
