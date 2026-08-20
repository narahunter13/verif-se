<script lang="ts">
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
</script>

{#if label}
  <!-- svelte-ignore a11y_label_has_associated_control -->
  <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
    {label}
    {#if required}<span class="text-red-500"> *</span>{/if}
  </label>
{/if}

<select
  bind:value
  {disabled}
  class="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed {value ? 'text-gray-800' : 'text-gray-400'}"
>
  <option value="" disabled>{placeholder}</option>
  {#each options as option (option)}
    <option value={option}>{option}</option>
  {/each}
</select>
