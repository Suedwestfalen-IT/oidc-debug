/**
 * Clientseitige Signaturprüfung des Access Tokens – Ersatz für das vormalige
 * FastAPI-`/me`-Backend. Da der OIDC-Client ein Public Client ist (kein
 * Client-Secret, kein vertraulicher Server), gibt es hier keinen
 * Sicherheitsgewinn durch ein separates Backend: die JWKS sind ohnehin
 * öffentlich, und die Signaturprüfung braucht kein Geheimnis. `jose` nutzt
 * die WebCrypto-API des Browsers für die eigentliche RS256/ES256-Prüfung.
 *
 * Wichtig: Das ist eine reine Debug-/Anzeigefunktion dieser App, kein
 * Ersatz für serverseitige Autorisierung. Eine echte Ressource (eigene API,
 * eigenes Backend) muss das Access Token immer selbst validieren – ein
 * Public Client kann grundsätzlich nicht "beweisen", dass er nicht
 * manipuliert wurde.
 */
import { createRemoteJWKSet, jwtVerify, type JWTVerifyResult } from 'jose';
import { get } from 'svelte/store';
import { settings } from './settings.ts';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwksIssuer: string | null = null;

/**
 * Lazy: JWKS-Endpoint per OIDC-Discovery ermitteln, dann JWKSet cachen (jose
 * cached intern pro Set). Wird neu geladen, sobald sich der Issuer ändert
 * (z. B. nach einer Änderung im Settings-Screen oder einem Reset).
 */
async function getJwks(issuer: string) {
  if (jwks && jwksIssuer === issuer) return jwks;
  const discoveryUrl = `${issuer}/.well-known/openid-configuration`;
  const resp = await fetch(discoveryUrl);
  if (!resp.ok) throw new Error(`Discovery-Dokument nicht erreichbar (${resp.status})`);
  const { jwks_uri } = await resp.json();
  if (!jwks_uri) throw new Error('Discovery-Dokument enthält keinen jwks_uri');
  jwks = createRemoteJWKSet(new URL(jwks_uri));
  jwksIssuer = issuer;
  return jwks;
}

export interface VerifyResult {
  claims: Record<string, unknown> | null;
  error: string | null;
}

/** Access Token signaturprüfen (RS256/ES256 je nach Provider-Schlüssel, via WebCrypto). */
export async function verifyAccessToken(token: string): Promise<VerifyResult> {
  const issuer = get(settings).issuer;
  try {
    const keySet = await getJwks(issuer);
    const { payload }: JWTVerifyResult = await jwtVerify(token, keySet, { issuer });
    return { claims: payload as Record<string, unknown>, error: null };
  } catch (e) {
    return { claims: null, error: e instanceof Error ? e.message : String(e) };
  }
}
