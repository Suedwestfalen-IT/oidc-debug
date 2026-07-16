<script>
  import { currentUser, decodeJwt, fetchUserInfo, ACR_LEVELS } from '../lib/oidc.ts';
  import { verifyAccessToken } from '../lib/verify.ts';
  import ClaimsTable from './ClaimsTable.svelte';
  import StepUpPanel from './StepUpPanel.svelte';

  let userinfo = $state(null);
  let verified = $state(null);    // { claims, error } aus verifyAccessToken

  async function refresh() {
    userinfo = null;
    verified = null;
    const [ui, v] = await Promise.all([
      fetchUserInfo(),
      verifyAccessToken($currentUser.access_token),
    ]);
    userinfo = ui;
    verified = v;
  }

  // Nach jedem (Step-up-)Login neu laden – reagiert auf currentUser-Änderungen
  $effect(() => {
    if ($currentUser) refresh();
  });

  let idClaims = $derived($currentUser ? decodeJwt($currentUser.id_token ?? '') : null);
  let accessClaims = $derived($currentUser ? decodeJwt($currentUser.access_token) : null);
  let verifiedAcr = $derived(verified?.claims?.acr ?? null);
  let verifiedAcrLevel = $derived(ACR_LEVELS[verifiedAcr ?? ''] ?? 0);

  let copied = $state('');
  async function copy(label, text) {
    await navigator.clipboard.writeText(text);
    copied = label;
    setTimeout(() => (copied = ''), 1500);
  }
</script>

<StepUpPanel />

<div class="row g-4">
  <div class="col-lg-6">
    <div class="card shadow-sm h-100">
      <div class="card-header bg-white fw-semibold">
        <i class="bi bi-person-badge me-2 text-primary"></i>ID Token (Client-Sicht)
      </div>
      <ClaimsTable claims={idClaims} />
    </div>
  </div>

  <div class="col-lg-6">
    <div class="card shadow-sm h-100">
      <div class="card-header bg-white fw-semibold">
        <i class="bi bi-key me-2 text-primary"></i>Access Token (dekodiert, unvalidiert)
      </div>
      <ClaimsTable claims={accessClaims} />
    </div>
  </div>

  <div class="col-lg-6">
    <div class="card shadow-sm h-100">
      <div class="card-header bg-white d-flex justify-content-between align-items-center">
        <span class="fw-semibold"><i class="bi bi-cloud-download me-2 text-primary"></i>UserInfo-Endpoint (IdP)</span>
        <button class="btn btn-sm btn-outline-secondary" onclick={refresh} aria-label="Aktualisieren">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>
      {#if userinfo}
        <ClaimsTable claims={userinfo} />
      {:else}
        <div class="p-3"><div class="spinner-border spinner-border-sm text-primary"></div></div>
      {/if}
    </div>
  </div>

  <div class="col-lg-6">
    <div class="card shadow-sm h-100">
      <div class="card-header bg-white fw-semibold">
        <i class="bi bi-shield-check me-2 text-primary"></i>Signaturgeprüfte Sicht (WebCrypto, RS256/ES256 via JWKS)
      </div>
      {#if verified === null}
        <div class="p-3"><div class="spinner-border spinner-border-sm text-primary"></div></div>
      {:else if verified.error}
        <div class="p-3 text-danger small">
          <i class="bi bi-exclamation-triangle me-1"></i>Signaturprüfung fehlgeschlagen: {verified.error}
        </div>
      {:else}
        <div class="px-3 pt-2 small text-muted">
          ACR-Level (signaturgeprüft): <strong>{verifiedAcr ?? '–'}</strong> (Stufe {verifiedAcrLevel})
        </div>
        <ClaimsTable claims={verified.claims} />
      {/if}
    </div>
  </div>

  <div class="col-12">
    <div class="card shadow-sm">
      <div class="card-header bg-white fw-semibold">
        <i class="bi bi-file-earmark-code me-2 text-primary"></i>Raw Tokens
      </div>
      <div class="card-body">
        {#each [['ID Token', $currentUser?.id_token], ['Access Token', $currentUser?.access_token], ['Refresh Token', $currentUser?.refresh_token]] as [label, token]}
          {#if token}
            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="small fw-semibold">{label}</span>
                <button class="btn btn-sm btn-outline-secondary py-0" onclick={() => copy(label, token)}>
                  {#if copied === label}<i class="bi bi-check-lg text-success"></i>{:else}<i class="bi bi-clipboard"></i>{/if}
                </button>
              </div>
              <pre class="bg-light rounded p-2 mb-0 text-break" style="font-size:.65rem;white-space:pre-wrap">{token}</pre>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  </div>
</div>
