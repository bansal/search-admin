export default defineEventHandler(async (event) => {
  const status = getAuthConfigStatus();
  const body = await readBody<{
    url?: string;
    masterKey?: string;
    remember?: boolean;
  }>(event);

  const config = useRuntimeConfig();
  const url = (status.envUrl ? config.meili.url : body.url)?.trim() ?? "";
  const masterKey =
    (status.envMasterKey ? config.meili.masterKey : body.masterKey)?.trim() ??
    "";

  if (!url || !masterKey) {
    throw createError({
      statusCode: 400,
      statusMessage: "Search URL and master key are required",
    });
  }

  await verifyAuthCredentials({ url, masterKey });

  if (body.remember) {
    setAuthSessionCookie(event, {
      url: status.envUrl ? undefined : url,
      masterKey: status.envMasterKey ? undefined : masterKey,
    });
  }

  return {
    persisted: !!body.remember,
  };
});
