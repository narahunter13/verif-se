<script lang="ts">
  import { tick } from 'svelte';

  let {
    value = $bindable(''),
    options = [],
    label = '',
    placeholder = 'Pilih...',
    disabled = false,
    required = false
  }: {
    value: string;
    options: string[];
    label: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
  } = $props();

  let isOpen = $state(false);
  let highlightedIndex = $state(-1);
  let listEl = $state<HTMLDivElement | null>(null);
  let triggerEl = $state<HTMLButtonElement | null>(null);

  const displayText = $derived(value || placeholder);
  const hasValue = $derived(!!value);

  const close = () => {
    isOpen = false;
    highlightedIndex = -1;
  };

  const toggle = () => {
    if (disabled) return;
    isOpen = !isOpen;
    if (isOpen) highlightedIndex = value ? options.indexOf(value) : -1;
  };

  const select = (option: string) => {
    value = option;
    close();
    triggerEl?.focus();
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        isOpen = true;
        highlightedIndex = value ? options.indexOf(value) : 0;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        highlightedIndex = Math.min(highlightedIndex + 1, options.length - 1);
        scrollToHighlighted();
        break;
      case 'ArrowUp':
        e.preventDefault();
        highlightedIndex = Math.max(highlightedIndex - 1, 0);
        scrollToHighlighted();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          select(options[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        triggerEl?.focus();
        break;
    }
  };

  const scrollToHighlighted = async () => {
    await tick();
    if (!listEl) return;
    const item = listEl.querySelector(`[data-index="${highlightedIndex}"]`);
    item?.scrollIntoView({ block: 'nearest' });
  };

  const handleOutsideClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-custom-select]')) {
      close();
    }
  };
</script>

<svelte:document onclick={handleOutsideClick} />

<div class="relative {isOpen ? 'z-50' : ''}" data-custom-select>
  {#if label}
    <!-- svelte-ignore a11y_label_has_associated_control -->
  <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
      {label}
      {#if required}<span class="text-red-500"> *</span>{/if}
    </label>
  {/if}

  <button
    bind:this={triggerEl}
    type="button"
    onclick={toggle}
    onkeydown={handleKeydown}
    {disabled}
    class="w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm border rounded-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
      {disabled
        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
        : hasValue
          ? 'bg-white border-gray-300 text-gray-800 cursor-pointer hover:border-gray-400'
          : 'bg-white border-gray-300 text-gray-400 cursor-pointer hover:border-gray-400'}
      {isOpen ? 'ring-2 ring-primary-500 border-primary-500' : ''}"
    aria-haspopup="listbox"
    aria-expanded={isOpen}
  >
    <span class="truncate">{displayText}</span>
    <svg
      class="w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ml-2 {isOpen ? 'rotate-180' : ''}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {#if isOpen}
    <div
      bind:this={listEl}
      role="listbox"
      class="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-sm shadow-lg max-h-60 overflow-y-auto animate-dropdown-in"
    >
      {#each options as option, i}
        <button
          type="button"
          data-index={i}
          role="option"
          aria-selected={option === value}
          onclick={() => select(option)}
          class="w-full text-left px-3 py-2 text-xs sm:text-sm transition-colors duration-100
            {option === value
              ? 'bg-primary-100 text-primary-700 font-medium'
              : i === highlightedIndex
                ? 'bg-primary-50 text-gray-800'
                : 'text-gray-700 hover:bg-gray-50'}"
        >
          {option}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  @keyframes dropdown-in {
    from {
      opacity: 0;
      transform: scaleY(0.95) translateY(-4px);
    }
    to {
      opacity: 1;
      transform: scaleY(1) translateY(0);
    }
  }
  .animate-dropdown-in {
    animation: dropdown-in 150ms ease-out forwards;
    transform-origin: top center;
  }
</style>
