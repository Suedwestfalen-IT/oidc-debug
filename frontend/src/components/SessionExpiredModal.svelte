<script>
  import { sessionState, loginWithAcr } from '../lib/oidc.ts';
</script>

{#if $sessionState === 'expired'}
  <div class="backdrop">
    <div class="card p-4 text-center shadow-lg modal-card">
      <i class="bi bi-clock-history text-warning mb-3" style="font-size:2.5rem"></i>
      <h6 class="fw-bold mb-1">Session abgelaufen</h6>
      <p class="text-muted small mb-4">Deine Sitzung ist abgelaufen.<br>Melde dich erneut an, um fortzufahren.</p>
      <button class="btn btn-primary w-100" onclick={() => loginWithAcr('bronze')}>
        <i class="bi bi-box-arrow-in-right me-2"></i>Erneut einloggen
      </button>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }
  .modal-card {
    max-width: 340px;
    width: 100%;
    border-radius: 12px;
    animation: pop-in 0.18s ease;
  }
  @keyframes pop-in {
    from { opacity: 0; transform: scale(0.94); }
    to   { opacity: 1; transform: scale(1); }
  }
</style>
