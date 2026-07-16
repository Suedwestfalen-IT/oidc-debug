import { writable } from 'svelte/store';

const STORAGE_KEY = 'oidc-debug:settings';
const DISCOVERY_SUFFIX = '/.well-known/openid-configuration';

export interface Settings {
  issuer: string;
  clientId: string;
  extraScopes: string; // space-getrennt, zusätzlich zu openid email profile
}

const EMPTY: Settings = { issuer: '', clientId: 'dashboard', extraScopes: '' };

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    return {
      issuer: parsed.issuer ?? '',
      clientId: parsed.clientId || 'dashboard',
      extraScopes: parsed.extraScopes ?? '',
    };
  } catch {
    return { ...EMPTY };
  }
}

export const settings = writable<Settings>(load());

// Bei jeder Änderung sofort in localStorage spiegeln.
settings.subscribe((value) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // localStorage nicht verfügbar (z. B. privater Modus mit Speicherlimit) — Config bleibt nur im Speicher.
  }
});

/** Vollständig konfiguriert (Issuer ist die einzige Pflichtangabe)? */
export function isConfigured(s: Settings): boolean {
  return s.issuer.trim().length > 0;
}

/** Zusammengesetzter OIDC-Scope-String für oidc-client-ts. */
export function scopeOf(s: Settings): string {
  return `openid email profile ${s.extraScopes}`.trim();
}

/** Setzt die Konfiguration zurück auf leer und löscht den localStorage-Eintrag. */
export function clearSettings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignorieren, Store wird unten trotzdem zurückgesetzt
  }
  settings.set({ ...EMPTY });
}

export interface ResolveResult {
  issuer: string;         // ermittelter reiner Issuer (ohne /.well-known/...)
  usedFallback: boolean;  // true = erst nach Anhängen von .well-known/... gefunden
}

/** Lädt eine URL und prüft, ob die Antwort ein gültiges OIDC-Discovery-Dokument ist. */
async function fetchDiscoveryDirect(url: string): Promise<boolean> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return false;
    const data = await resp.json();
    return typeof data?.jwks_uri === 'string';
  } catch {
    return false;
  }
}

/**
 * Normalisiert eine vom Nutzer eingegebene Provider-URL auf den reinen Issuer.
 * Deckt zwei Eingabeformen ab, je nachdem was unter der eingegebenen URL
 * *selbst* (ohne etwas anzuhängen) erreichbar ist:
 *   1. Die eingegebene URL liefert selbst schon ein gültiges Discovery-Dokument
 *      – das ist der Fall, wenn die komplette Discovery-URL eingegeben wurde
 *      (z. B. https://sso.example.org/realms/myrealm/.well-known/openid-configuration).
 *      Das Suffix wird abgeschnitten, der Rest ist der Issuer.
 *   2. Die eingegebene URL liefert selbst kein Discovery-Dokument – dann wird
 *      probiert, ob sie als reiner Issuer taugt, also ob
 *      "<eingabe>/.well-known/openid-configuration" ein gültiges Dokument liefert.
 * Wirft einen Error mit einer für die UI verständlichen Meldung, wenn unter
 * keiner der beiden Varianten ein gültiges Discovery-Dokument gefunden wird.
 */
export async function resolveIssuer(input: string): Promise<ResolveResult> {
  const raw = input.trim().replace(/\/$/, '');
  if (!raw) throw new Error('Bitte eine Issuer- oder Discovery-URL eingeben.');

  // Variante 1: eingegebene URL exakt so probieren, wie sie dasteht — deckt
  // sowohl "schon komplette Discovery-URL" als auch generell jede URL ab,
  // unter der direkt (ohne weiteres Anhängen) ein Discovery-Dokument liegt.
  if (await fetchDiscoveryDirect(raw)) {
    const issuer = raw.endsWith(DISCOVERY_SUFFIX) ? raw.slice(0, -DISCOVERY_SUFFIX.length) : raw;
    return { issuer, usedFallback: false };
  }

  // Variante 2: eingegebene URL als reinen Issuer behandeln und das Suffix anhängen.
  const withSuffix = raw.endsWith(DISCOVERY_SUFFIX) ? raw : raw + DISCOVERY_SUFFIX;
  if (withSuffix !== raw && await fetchDiscoveryDirect(withSuffix)) {
    const issuer = withSuffix.slice(0, -DISCOVERY_SUFFIX.length);
    return { issuer, usedFallback: true };
  }

  throw new Error(
    `Unter "${raw}" wurde kein gültiges OIDC-Discovery-Dokument gefunden ` +
    `(weder direkt noch unter ${DISCOVERY_SUFFIX}). Bitte Issuer-URL und ` +
    'Erreichbarkeit/CORS-Einstellungen des Providers prüfen.',
  );
}
