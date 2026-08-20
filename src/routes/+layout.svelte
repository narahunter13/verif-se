<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import { store } from '$lib/state/appState.svelte';

  let { children } = $props();
  let isMobileMenuOpen = $state(false);

  $effect(() => {
    store.fetchData();
  });

  const navItems = [
    { path: '/', label: 'Form', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { path: '/dashboard', label: 'Dashboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
  ];
</script>

<div class="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
  <!-- Desktop Sidebar -->
  <aside class="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-primary-600 text-white">
    <div class="flex items-center h-16 px-6 bg-primary-700">
      <svg class="w-7 h-7 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span class="text-base sm:text-lg font-bold">Verif SE</span>
    </div>
    <nav class="flex-1 px-4 py-6 space-y-1">
      {#each navItems as item}
        <a
          href={item.path}
          class="flex items-center px-3 py-2.5 text-sm rounded-sm transition-all duration-200 {page.url.pathname === item.path ? 'bg-primary-700 text-white shadow-sm' : 'text-primary-100 hover:bg-primary-500'}"
        >
          <svg class="w-5 h-5 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
          </svg>
          {item.label}
        </a>
      {/each}
    </nav>
  </aside>

  <!-- Mobile Header -->
  <header class="md:hidden fixed top-0 left-0 right-0 h-14 bg-primary-600 text-white flex items-center justify-between px-4 z-50 shadow-md">
    <div class="flex items-center">
      <svg class="w-7 h-7 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span class="text-base font-bold">Verif SE</span>
    </div>
    <button
      onclick={() => isMobileMenuOpen = !isMobileMenuOpen}
      class="p-2 rounded-sm hover:bg-primary-500 transition-colors duration-150"
      aria-label="Toggle menu"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {#if isMobileMenuOpen}
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        {:else}
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        {/if}
      </svg>
    </button>
  </header>

  <!-- Mobile Menu Overlay -->
  {#if isMobileMenuOpen}
    <div
      class="md:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in"
      role="button"
      tabindex="-1"
      onclick={() => isMobileMenuOpen = false}
      onkeydown={(e) => { if (e.key === 'Escape') isMobileMenuOpen = false; }}
    ></div>
    <div class="md:hidden fixed top-14 right-0 w-56 bg-primary-600 text-white z-50 shadow-xl animate-slide-in-right rounded-sm">
      <nav class="p-3 space-y-1">
        {#each navItems as item}
          <a
            href={item.path}
            onclick={() => isMobileMenuOpen = false}
            class="flex items-center px-3 py-2.5 text-sm rounded-sm transition-all duration-200 {page.url.pathname === item.path ? 'bg-primary-700 text-white' : 'text-primary-100 hover:bg-primary-500'}"
          >
            <svg class="w-5 h-5 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
            </svg>
            {item.label}
          </a>
        {/each}
      </nav>
    </div>
  {/if}

  <!-- Main Content -->
  <main class="md:ml-64 pt-14 md:pt-0 min-h-screen">
    <div class="p-3 sm:p-4 md:p-8">
      {@render children()}
    </div>
  </main>
</div>
