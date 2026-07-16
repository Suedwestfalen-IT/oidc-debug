<script>
  import { currentUser, loginWithAcr, acrLevel } from '../lib/oidc.ts';

  let essential = $state(false);

  let currentAcr = $derived($currentUser?.profile?.acr);
  let currentLevel = $derived(acrLevel(currentAcr));

  const levels = ['bronze', 'silver', 'gold'];
  const icons = { bronze: 'bi-shield', silver: 'bi-shield-shaded', gold: 'bi-shield-fill-check' };
</script>

<div class="card shadow-sm mb-4">
  <div class="card-header bg-white d-flex justify-content-between align-items-center">
    <span class="fw-semibold"><i class="bi bi-arrow-up-circle me-2 text-primary"></i>Step-up</span>
    <div class="form-check form-switch mb-0">
      <input class="form-check-input" type="checkbox" id="essential" bind:checked={essential} />
      <label class="form-check-label small text-muted" for="essential" title="Sendet den OIDC-claims-Parameter mit essential acr statt acr_values">
        essential claim
      </label>
    </div>
  </div>
  <div class="card-body">
    <p class="text-muted small mb-3">
      Erneuter Authorize-Request an den IdP mit
      {#if essential}
        <code>claims</code>-Parameter (<code>acr</code> essential) –
        der Provider <em>erzwingt</em> das Level (providerabhängig).
      {:else}
        <code>acr_values=&lt;level&gt;</code> – bei bestehender SSO-Session
        fragt der Provider i. d. R. nur die fehlenden Faktoren nach.
      {/if}
    </p>
    <div class="d-flex gap-2">
      {#each levels as level}
        <button
          class="btn flex-fill {currentAcr === level ? 'btn-success' : acrLevel(level) < currentLevel ? 'btn-outline-secondary' : 'btn-outline-primary'}"
          onclick={() => loginWithAcr(level, { essential })}
        >
          <i class="bi {icons[level]} me-1"></i>{level}
          {#if currentAcr === level}<i class="bi bi-check-lg ms-1"></i>{/if}
        </button>
      {/each}
    </div>
    <div class="text-muted mt-2" style="font-size:.75rem">
      Aktuelles Level: <strong>{currentAcr ?? 'unbekannt'}</strong> ·
      Ein Request auf ein niedrigeres Level ist erlaubt – der Provider liefert bei
      bestehender Session i. d. R. das bereits erreichte ACR zurück.
    </div>
  </div>
</div>
