<script>
  import { onMount } from 'svelte';
  import { getUserManager, currentUser } from './lib/oidc.ts';
  import { settings, isConfigured } from './lib/settings.ts';
  import LoginScreen from './components/LoginScreen.svelte';
  import SettingsView from './components/SettingsView.svelte';
  import Navbar from './components/Navbar.svelte';
  import DebugView from './components/DebugView.svelte';
  import SessionExpiredModal from './components/SessionExpiredModal.svelte';

  let view = 'loading';                       // loading | setup | login | app
  let showSettings = false;                   // Zahnrad-Overlay, wenn bereits eingeloggt

  onMount(async () => {
    // Ohne Provider-Konfiguration kann kein UserManager gebaut werden (kein
    // sinnvoller Default mehr — die App kennt keinen Provider von sich aus).
    if (!isConfigured($settings)) {
      view = 'setup';
      return;
    }

    const userManager = getUserManager();

    if (new URLSearchParams(location.search).has('code')) {
      try {
        const user = await userManager.signinRedirectCallback();
        history.replaceState(null, '', location.pathname);
        currentUser.set(user);
      } catch (e) {
        console.error('OIDC callback error:', e);
        view = 'login';
        return;
      }
    }

    const user = await userManager.getUser();
    if (user && !user.expired) {
      currentUser.set(user);
      view = 'app';
    } else {
      view = 'login';
    }
  });

  function onSetupSaved() {
    view = 'login';
  }

  // Falls die Config während der Nutzung geleert wird (Zahnrad -> Zurücksetzen),
  // zurück zum Setup-Screen statt eine Debug-Ansicht mit ungültiger Config zu zeigen.
  $: if (view === 'app' || view === 'login') {
    if (!isConfigured($settings)) {
      showSettings = false;
      view = 'setup';
    }
  }
</script>

{#if view === 'loading'}
  <div class="d-flex align-items-center justify-content-center min-vh-100 bg-light">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Laden…</span>
    </div>
  </div>
{:else if view === 'setup'}
  <div class="d-flex align-items-center justify-content-center min-vh-100 bg-light">
    <div class="w-100" style="max-width:520px">
      <div class="text-center mb-3">
        <i class="bi bi-shield-lock-fill text-primary" style="font-size:2.5rem"></i>
        <h5 class="fw-bold mt-2 mb-0">OIDC Debug</h5>
        <p class="text-muted small">Zuerst den OIDC-Provider konfigurieren</p>
      </div>
      <SettingsView embedded={true} onSaved={onSetupSaved} />
    </div>
  </div>
{:else if view === 'login'}
  <LoginScreen onOpenSettings={() => (showSettings = true)} />
  {#if showSettings}
    <div class="position-fixed d-flex align-items-center justify-content-center" style="inset:0;background:rgba(0,0,0,.4);z-index:1050">
      <div class="w-100 mx-3" style="max-width:520px">
        <SettingsView embedded={true} onSaved={() => (showSettings = false)} />
        <div class="text-center mt-2">
          <button class="btn btn-link btn-sm text-white" on:click={() => (showSettings = false)}>Schließen</button>
        </div>
      </div>
    </div>
  {/if}
{:else}
  <SessionExpiredModal />
  <div class="min-vh-100 bg-light">
    <Navbar onOpenSettings={() => (showSettings = true)} />
    <div class="container py-4">
      <DebugView />
    </div>
  </div>
  {#if showSettings}
    <div class="position-fixed d-flex align-items-center justify-content-center" style="inset:0;background:rgba(0,0,0,.4);z-index:1050">
      <div class="w-100 mx-3" style="max-width:520px">
        <SettingsView embedded={true} onSaved={() => (showSettings = false)} />
        <div class="text-center mt-2">
          <button class="btn btn-link btn-sm text-white" on:click={() => (showSettings = false)}>Schließen</button>
        </div>
      </div>
    </div>
  {/if}
{/if}
