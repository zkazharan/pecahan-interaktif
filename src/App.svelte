<script lang="ts">
  import { findModule } from './content/registry';
  import { router } from './lib/route.svelte';
  import Home from './pages/Home.svelte';
  import ModulePage from './pages/ModulePage.svelte';

  const route = $derived(router.route);
  const mod = $derived(route.name === 'module' ? findModule(route.slug) : undefined);

  $effect(() => {
    if (route.name === 'module' && !mod) router.replace({ name: 'home' });
  });
</script>

{#if route.name === 'module' && mod}
  {#key route.slug}
    <ModulePage module={mod} tab={route.tab} params={route.params} />
  {/key}
{:else}
  <Home />
{/if}
