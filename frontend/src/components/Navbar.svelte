<script>
  import { currentUser, logout } from '../lib/oidc.ts';

  export let onOpenSettings = () => {};

  let open = false;

  $: profile = $currentUser?.profile;
  $: displayName = profile?.name ?? profile?.preferred_username ?? '';
  $: acr = profile?.acr ?? '–';

  const acrBadge = (a) =>
    ({ bronze: 'text-bg-secondary', silver: 'text-bg-light border', gold: 'text-bg-warning' }[a] ?? 'text-bg-danger');
</script>

<nav class="navbar navbar-light bg-white border-bottom px-4 py-2 shadow-sm">
  <div class="d-flex align-items-center gap-4">
    <span class="navbar-brand fw-bold mb-0">
      <i class="bi bi-shield-check me-2 text-primary"></i>OIDC Debug
    </span>
  </div>

  <div class="d-flex align-items-center gap-3">
    <span class="badge {acrBadge(acr)}" title="Aktuelles ACR-Level (aus dem ID Token)">acr: {acr}</span>

    <button
      class="btn btn-sm btn-light border"
      title="Provider-Einstellungen"
      on:click={onOpenSettings}
    >
      <i class="bi bi-gear text-primary"></i>
    </button>

    <div class="position-relative">
      <button
        class="btn btn-sm btn-light border d-flex align-items-center gap-2"
        on:click={() => (open = !open)}
      >
        <i class="bi bi-person-circle text-primary"></i>
        <span>{displayName}</span>
        <i class="bi bi-chevron-{open ? 'up' : 'down'}" style="font-size:.65rem"></i>
      </button>

      {#if open}
        <div
          class="position-fixed"
          style="inset:0;z-index:1000"
          on:click={() => (open = false)}
          role="presentation"
        ></div>
        <div class="dropdown-menu show shadow-sm" style="right:0;left:auto;min-width:200px;z-index:1001">
          <div class="px-3 py-2 text-muted" style="font-size:.75rem">Angemeldet als</div>
          <div class="px-3 pb-2 fw-semibold small">{displayName}</div>
          <div class="dropdown-divider my-1"></div>
          <button
            class="dropdown-item d-flex align-items-center gap-2 text-danger"
            on:click={logout}
          >
            <i class="bi bi-box-arrow-right"></i>Abmelden
          </button>
        </div>
      {/if}
    </div>
  </div>
</nav>
