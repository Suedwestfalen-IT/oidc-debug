<script>
  import { settings, isConfigured, clearSettings } from '../lib/settings.ts';
  import { logout } from '../lib/oidc.ts';

  export let onSaved = () => {};
  export let embedded = false; // true = im Navbar-Dropdown/Modal, false = eigener Vollbild-Screen

  let issuer = $settings.issuer;
  let clientId = $settings.clientId;
  let extraScopes = $settings.extraScopes;
  let confirmClear = false;

  $: valid = issuer.trim().length > 0;

  function save() {
    if (!valid) return;
    settings.set({ issuer: issuer.trim().replace(/\/$/, ''), clientId: clientId.trim() || 'dashboard', extraScopes: extraScopes.trim() });
    onSaved();
  }

  function handleClear() {
    if (!confirmClear) {
      confirmClear = true;
      return;
    }
    clearSettings();
    issuer = '';
    clientId = 'dashboard';
    extraScopes = '';
    confirmClear = false;
  }
</script>

<div class:card={embedded} class:shadow-sm={embedded}>
  {#if embedded}
    <div class="card-header bg-white fw-semibold">
      <i class="bi bi-gear me-2 text-primary"></i>Provider-Einstellungen
    </div>
  {/if}
  <div class:card-body={embedded} class:p-4={!embedded}>
    <div class="mb-3">
      <label class="form-label small fw-semibold" for="issuer">
        Issuer-URL <span class="text-danger">*</span>
      </label>
      <input
        id="issuer"
        class="form-control"
        placeholder="https://sso.example.org/realms/myrealm"
        bind:value={issuer}
      />
      <div class="form-text">
        Muss <code>&lt;issuer&gt;/.well-known/openid-configuration</code> bereitstellen.
        Beispiele: Keycloak <code>https://sso.example.org/realms/myrealm</code>,
        Authentik <code>https://auth.example.org/application/o/myapp</code>,
        Auth0 <code>https://mytenant.eu.auth0.com/</code>.
      </div>
    </div>

    <div class="mb-3">
      <label class="form-label small fw-semibold" for="clientId">Client-ID</label>
      <input id="clientId" class="form-control" placeholder="dashboard" bind:value={clientId} />
      <div class="form-text">Public Client (kein Secret) mit Redirect-URI &amp; Web Origins <code>{window.location.origin}/</code>.</div>
    </div>

    <div class="mb-3">
      <label class="form-label small fw-semibold" for="scopes">Zusätzliche Scopes</label>
      <input id="scopes" class="form-control" placeholder="z. B. groups" bind:value={extraScopes} />
      <div class="form-text">Zusätzlich zu <code>openid email profile</code>, space-getrennt.</div>
    </div>

    <div class="d-flex gap-2">
      <button class="btn btn-primary" disabled={!valid} on:click={save}>
        <i class="bi bi-check-lg me-1"></i>Speichern
      </button>
      {#if isConfigured($settings)}
        <button
          class="btn {confirmClear ? 'btn-danger' : 'btn-outline-danger'}"
          on:click={handleClear}
          on:mouseleave={() => (confirmClear = false)}
        >
          <i class="bi bi-trash me-1"></i>{confirmClear ? 'Wirklich löschen?' : 'Zurücksetzen'}
        </button>
      {/if}
    </div>
    {#if isConfigured($settings)}
      <div class="form-text mt-2">
        <i class="bi bi-info-circle me-1"></i>Ändern erfordert einen erneuten Login.
        <button class="btn btn-link btn-sm p-0 align-baseline" on:click={logout}>Jetzt abmelden</button>
      </div>
    {/if}
  </div>
</div>
