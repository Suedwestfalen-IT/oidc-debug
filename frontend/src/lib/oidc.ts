import { UserManager, WebStorageStateStore, type User } from 'oidc-client-ts';
import { writable, get } from 'svelte/store';
import { settings, scopeOf, type Settings } from './settings.ts';

export type Acr = 'bronze' | 'silver' | 'gold';
export const ACR_LEVELS: Record<string, number> = { bronze: 1, silver: 2, gold: 3 };
export const acrLevel = (acr?: string | null) => ACR_LEVELS[acr ?? ''] ?? 0;

// 'active' | 'expired' — wird von UserManager-Events gesetzt
export const sessionState = writable<'active' | 'expired'>('active');

// aktuell eingeloggter User (inkl. Tokens) als Store für die Debug-Ansicht
export const currentUser = writable<User | null>(null);

let manager: UserManager | null = null;
let managerSettings: Settings | null = null;

function buildUserManager(s: Settings): UserManager {
  const um = new UserManager({
    authority:                s.issuer,
    client_id:                s.clientId,
    redirect_uri:             window.location.origin + '/',
    post_logout_redirect_uri: window.location.origin + '/',
    scope:                    scopeOf(s),
    automaticSilentRenew:     true,
    userStore:                new WebStorageStateStore({ store: window.localStorage }),
  });
  um.events.addSilentRenewError(() => sessionState.set('expired'));
  um.events.addUserUnloaded(() => { sessionState.set('expired'); currentUser.set(null); });
  um.events.addUserSignedOut(() => sessionState.set('expired'));
  um.events.addUserLoaded((u) => { sessionState.set('active'); currentUser.set(u); });
  return um;
}

/**
 * Liefert den UserManager für die aktuellen Settings. Wird neu gebaut, wenn
 * sich Issuer/Client-ID/Scopes seit dem letzten Aufruf geändert haben (z. B.
 * nach dem Speichern im Settings-Screen) — so muss die App nach einer
 * Konfigurationsänderung nicht neu geladen werden.
 */
export function getUserManager(): UserManager {
  const s = get(settings);
  const changed =
    !managerSettings ||
    managerSettings.issuer !== s.issuer ||
    managerSettings.clientId !== s.clientId ||
    managerSettings.extraScopes !== s.extraScopes;

  if (!manager || changed) {
    manager = buildUserManager(s);
    managerSettings = { ...s };
  }
  return manager;
}

/**
 * Login bzw. Step-up mit gewünschtem ACR-Level.
 * - Standardfall: `acr_values=<level>` als Query-Parameter zum IdP
 * - essential=true: stattdessen OIDC-`claims`-Parameter mit essential acr
 *   (manche Provider, z. B. Keycloak, erzwingen das Level dann hart statt "best effort")
 * Bei bestehender SSO-Session fragt der Provider i. d. R. nur die fehlenden Faktoren ab (Step-up).
 */
export function loginWithAcr(acr: Acr = 'bronze', opts: { essential?: boolean } = {}) {
  const um = getUserManager();
  if (opts.essential) {
    return um.signinRedirect({
      extraQueryParams: {
        claims: JSON.stringify({ id_token: { acr: { essential: true, values: [acr] } } }),
      },
    });
  }
  return um.signinRedirect({ acr_values: acr });
}

export const logout = () => getUserManager().signoutRedirect();

/** JWT-Payload dekodieren (nur Anzeige, unvalidiert — Signaturprüfung siehe verify.ts). */
export function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

/** UserInfo-Endpoint des IdP abfragen (Adresse via OIDC-Discovery, providerunabhängig). */
export async function fetchUserInfo(): Promise<Record<string, unknown> | { error: string }> {
  const um = getUserManager();
  const user = await um.getUser();
  if (!user || user.expired) return { error: 'Kein gültiger Login' };
  try {
    const { userinfo_endpoint } = await um.metadataService.getMetadata();
    if (!userinfo_endpoint) return { error: 'Provider liefert keinen userinfo_endpoint' };
    const resp = await fetch(userinfo_endpoint, { headers: { Authorization: `Bearer ${user.access_token}` } });
    if (!resp.ok) return { error: `${resp.status} ${resp.statusText}` };
    return await resp.json();
  } catch (e) {
    return { error: String(e) };
  }
}
