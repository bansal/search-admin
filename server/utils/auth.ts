import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import type { H3Event } from "h3";

const COOKIE_NAME = "search_auth_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type AuthCredentials = {
  url: string;
  masterKey: string;
};

export type AuthSessionCredentials = {
  url?: string;
  masterKey?: string;
};

export type AuthConfigStatus = {
  configured: boolean;
  missingFields: Array<"url" | "masterKey">;
  envUrl: boolean;
  envMasterKey: boolean;
  sessionAuthenticated: boolean;
  sessionPersisted: boolean;
};

function getSessionSecret(): Buffer {
  const config = useRuntimeConfig();
  const secret =
    config.sessionSecret?.trim() ||
    process.env.NUXT_SESSION_SECRET?.trim() ||
    "search-admin-dev-session-secret";

  return createHash("sha256").update(secret).digest();
}

function encryptCredentials(credentials: AuthSessionCredentials): string {
  const key = getSessionSecret();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const payload = Buffer.concat([
    cipher.update(JSON.stringify(credentials), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, payload]).toString("base64url");
}

function decryptCredentials(token: string): AuthSessionCredentials | null {
  try {
    const buffer = Buffer.from(token, "base64url");
    const iv = buffer.subarray(0, 16);
    const tag = buffer.subarray(16, 32);
    const payload = buffer.subarray(32);
    const key = getSessionSecret();
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([
      decipher.update(payload),
      decipher.final(),
    ]).toString("utf8");

    return JSON.parse(json) as AuthSessionCredentials;
  } catch {
    return null;
  }
}

export function readAuthSessionCookie(
  event: H3Event,
): AuthSessionCredentials | null {
  const token = getCookie(event, COOKIE_NAME);
  if (!token) {
    return null;
  }

  return decryptCredentials(token);
}

export function setAuthSessionCookie(
  event: H3Event,
  credentials: AuthSessionCredentials,
) {
  const token = encryptCredentials(credentials);

  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearAuthSessionCookie(event: H3Event) {
  deleteCookie(event, COOKIE_NAME, {
    path: "/",
  });
}

export function hasPersistedAuthSession(event: H3Event): boolean {
  return !!getCookie(event, COOKIE_NAME);
}

export function getAuthConfigStatus(): Omit<
  AuthConfigStatus,
  "sessionAuthenticated" | "sessionPersisted"
> {
  const config = useRuntimeConfig();
  const url = config.meili.url?.trim() ?? "";
  const masterKey = config.meili.masterKey?.trim() ?? "";

  const missingFields: AuthConfigStatus["missingFields"] = [];
  if (!url) missingFields.push("url");
  if (!masterKey) missingFields.push("masterKey");

  return {
    configured: missingFields.length === 0,
    missingFields,
    envUrl: !!url,
    envMasterKey: !!masterKey,
  };
}

export function mergeAuthCredentials(
  partial: AuthSessionCredentials,
  status: ReturnType<typeof getAuthConfigStatus>,
): AuthCredentials | null {
  const config = useRuntimeConfig();
  const url = (status.envUrl ? config.meili.url : partial.url)?.trim() ?? "";
  const masterKey =
    (status.envMasterKey
      ? config.meili.masterKey
      : partial.masterKey
    )?.trim() ?? "";

  if (!url || !masterKey) {
    return null;
  }

  return { url, masterKey };
}

export function hasCompleteAuthCredentials(
  partial: AuthSessionCredentials | null | undefined,
  status: ReturnType<typeof getAuthConfigStatus>,
): boolean {
  if (!partial) {
    return false;
  }

  return mergeAuthCredentials(partial, status) !== null;
}

export function getAuthSessionStatus(
  event?: H3Event,
): Pick<AuthConfigStatus, "sessionAuthenticated" | "sessionPersisted"> {
  const status = getAuthConfigStatus();

  if (status.configured) {
    return {
      sessionAuthenticated: true,
      sessionPersisted: false,
    };
  }

  if (!event) {
    return {
      sessionAuthenticated: false,
      sessionPersisted: false,
    };
  }

  const cookieCredentials = readAuthSessionCookie(event);
  const sessionPersisted = hasPersistedAuthSession(event);

  return {
    sessionAuthenticated: hasCompleteAuthCredentials(cookieCredentials, status),
    sessionPersisted,
  };
}

export function resolveAuthCredentials(event?: H3Event): AuthCredentials {
  const status = getAuthConfigStatus();

  if (status.configured) {
    const config = useRuntimeConfig();
    return {
      url: config.meili.url.trim(),
      masterKey: config.meili.masterKey.trim(),
    };
  }

  const cookieCredentials = event ? readAuthSessionCookie(event) : null;
  const fromCookie = cookieCredentials
    ? mergeAuthCredentials(cookieCredentials, status)
    : null;

  if (fromCookie) {
    return fromCookie;
  }

  const headerUrl = event ? getHeader(event, "x-auth-url")?.trim() : "";
  const headerKey = event ? getHeader(event, "x-auth-master-key")?.trim() : "";

  const fromHeaders = mergeAuthCredentials(
    { url: headerUrl, masterKey: headerKey },
    status,
  );

  if (fromHeaders) {
    return fromHeaders;
  }

  throw createError({
    statusCode: 401,
    statusMessage: "Search URL and master key are required",
  });
}

export async function verifyAuthCredentials(
  credentials: AuthCredentials,
): Promise<void> {
  const baseUrl = credentials.url.replace(/\/$/, "");

  try {
    await $fetch(`${baseUrl}/health`, {
      headers: {
        Authorization: `Bearer ${credentials.masterKey}`,
      },
    });
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid Search URL or master key",
    });
  }
}
