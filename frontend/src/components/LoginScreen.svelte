<script>
  import { loginWithAcr } from '../lib/oidc.ts';
  import { settings } from '../lib/settings.ts';

  export let onOpenSettings = () => {};
</script>

<div class="d-flex align-items-center justify-content-center min-vh-100 bg-light position-relative">
  <button
    class="btn btn-sm btn-light border position-absolute top-0 end-0 m-3"
    title="Provider-Einstellungen"
    on:click={onOpenSettings}
  >
    <i class="bi bi-gear text-primary"></i>
  </button>

  <div class="card shadow-sm p-4 text-center login-card">
    <div class="mb-3 text-primary">
      <i class="bi bi-shield-lock-fill" style="font-size:2.5rem"></i>
    </div>
    <h5 class="fw-bold mb-1">OIDC Debug</h5>
    <p class="text-muted small mb-1">Svelte + OIDC · Step-up via <code>acr_values</code></p>
    <p class="text-muted mb-4 text-truncate" style="font-size:.7rem" title={$settings.issuer}>
      <i class="bi bi-hdd-network me-1"></i>{$settings.issuer}
    </p>

    <button class="btn btn-primary w-100 py-2 mb-3" on:click={() => loginWithAcr('bronze')}>
      <i class="bi bi-box-arrow-in-right me-2"></i>Anmelden <span class="badge text-bg-light ms-1">bronze</span>
    </button>

    <div class="text-muted mb-2" style="font-size:.75rem">Direkt mit höherem Level anmelden:</div>
    <div class="d-flex gap-2">
      <button class="btn btn-outline-secondary btn-sm flex-fill" on:click={() => loginWithAcr('silver')}>
        <i class="bi bi-shield-shaded me-1"></i>silver
      </button>
      <button class="btn btn-outline-warning btn-sm flex-fill" on:click={() => loginWithAcr('gold')}>
        <i class="bi bi-shield-fill-check me-1"></i>gold
      </button>
    </div>
  </div>
</div>

<style>
  .login-card {
    max-width: 380px;
    width: 100%;
    border-radius: 12px;
  }
</style>
