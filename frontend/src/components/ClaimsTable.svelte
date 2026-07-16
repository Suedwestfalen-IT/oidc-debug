<script>
  let { claims = null } = $props();

  const fmt = (v) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v));
  const isTimestamp = (k) => ['exp', 'iat', 'auth_time', 'nbf'].includes(k);
  const ts = (v) => new Date(v * 1000).toLocaleString('de-DE');
</script>

{#if claims}
  <div class="table-responsive">
    <table class="table table-sm table-hover mb-0" style="font-size:.8rem">
      <tbody>
        {#each Object.entries(claims) as [key, value]}
          <tr class:table-warning={key === 'acr'}>
            <td class="text-muted font-monospace" style="width:200px">{key}</td>
            <td class="font-monospace text-break">
              {fmt(value)}
              {#if isTimestamp(key) && typeof value === 'number'}
                <span class="text-muted ms-2">({ts(value)})</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <div class="text-muted small p-3">Keine Daten</div>
{/if}
