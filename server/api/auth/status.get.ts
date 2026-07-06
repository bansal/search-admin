export default defineEventHandler((event) => {
  return {
    ...getAuthConfigStatus(),
    ...getAuthSessionStatus(event),
  };
});
