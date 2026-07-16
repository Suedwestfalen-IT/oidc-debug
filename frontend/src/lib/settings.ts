import { writable } from 'svelte/store';

const STORAGE_KEY = 'oidc-debug:settings';

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
