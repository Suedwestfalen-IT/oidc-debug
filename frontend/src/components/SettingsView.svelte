<script>
  import { settings, isConfigured, clearSettings, resolveIssuer } from '../lib/settings.ts';
  import { logout } from '../lib/oidc.ts';

  let { onSaved = () => {}, embedded = false } = $props(); // embedded: true = im Navbar-Dropdown/Modal, false = eigener Vollbild-Screen

  let issuer = $state($settings.issuer);
  let clientId = $state($settings.clientId);
  let extraScopes = $state($settings.extraScopes);
  let confirmClear = $state(false);
  let checking = $state(false);
  let error = $state('');
  let fallbackNote = $state('');

  let valid = $derived(issuer.trim().length > 0);

  async function save() {
    if (!valid || checking) return;
    checking = true;
    error = '';
    fallbackNote = '';
    try {
      const result = await resolveIssuer(issuer);
      settings.set({
        issuer: result.issuer,
        clientId: clientId.trim() || 'dashboard',
        extraScopes: extraScopes.trim(),
      });
      if (result.usedFallback) {
        // Kurzer Hinweis, dann trotzdem weiter — kein Blocker.
        fallbackNote = `Hinweis: "${issuer.trim()}" war nicht direkt als Issuer nutzbar, ` +
          `${result.issuer} wurde nach Anhängen von /.well-known/openid-configuration erkannt.`;
      }
      onSaved();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      checking = false;
    }
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
    error = '';
    fallbackNote = '';
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
        Issuer- oder Discovery-URL <span class="text-danger">*</span>
      </label>
      <input
        id="issuer"
        class="form-control"
        placeholder="https://sso.example.org/realms/myrealm"
        bind:value={issuer}
      />
      <div class="form-text">
        Reine Issuer-URL oder komplette Discovery-URL (mit
        <code>/.well-known/openid-configuration</code>) – beides wird erkannt.
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

    {#if error}
      <div class="alert alert-danger py-2 small mb-3">
        <i class="bi bi-exclamation-triangle me-1"></i>{error}
      </div>
    {/if}
    {#if fallbackNote}
      <div class="alert alert-info py-2 small mb-3">
        <i class="bi bi-info-circle me-1"></i>{fallbackNote}
      </div>
    {/if}

    <div class="d-flex gap-2">
      <button class="btn btn-primary" disabled={!valid || checking} onclick={save}>
        {#if checking}
          <span class="spinner-border spinner-border-sm me-1"></span>Prüfe Discovery-Dokument…
        {:else}
          <i class="bi bi-check-lg me-1"></i>Speichern
        {/if}
      </button>
      {#if isConfigured($settings)}
        <button
          class="btn {confirmClear ? 'btn-danger' : 'btn-outline-danger'}"
          onclick={handleClear}
          onmouseleave={() => (confirmClear = false)}
        >
          <i class="bi bi-trash me-1"></i>{confirmClear ? 'Wirklich löschen?' : 'Zurücksetzen'}
        </button>
      {/if}
    </div>
    {#if isConfigured($settings)}
      <div class="form-text mt-2">
        <i class="bi bi-info-circle me-1"></i>Ändern erfordert einen erneuten Login.
        <button class="btn btn-link btn-sm p-0 align-baseline" onclick={logout}>Jetzt abmelden</button>
      </div>
    {/if}
  </div>
</div>
