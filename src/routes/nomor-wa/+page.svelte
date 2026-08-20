<script lang="ts">
  import { store } from '$lib/state/appState.svelte';
  import CustomSelect from '$lib/components/CustomSelect.svelte';

  let filterPJ = $state<string>('');

  const pjOptions = $derived(() => {
    const set = new Set(store.nomorWaList.map((n) => n.pjOrganik));
    return Array.from(set).sort();
  });

  const filteredList = $derived(() => {
    let data = store.nomorWaList;
    if (filterPJ) data = data.filter((n) => n.pjOrganik === filterPJ);
    return data.sort((a, b) => a.namaPpl.localeCompare(b.namaPpl));
  });
</script>

<div class="max-w-4xl mx-auto">
  <div class="mb-5 animate-fade-in-up">
    <h1 class="text-lg sm:text-xl md:text-2xl font-bold text-primary-700 flex items-center gap-2 sm:gap-3">
      <svg class="w-6 h-6 sm:w-7 sm:h-7 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
      Nomor WA PPL
    </h1>
    <p class="text-xs sm:text-sm text-gray-600 mt-1">Daftar nomor WhatsApp petugas pelaksana lapangan</p>
  </div>

  <!-- Filter -->
  <div class="bg-white rounded-sm shadow-md p-3 sm:p-4 mb-5 animate-fade-in-up" style="animation-delay: 50ms">
    <div class="flex flex-col sm:flex-row flex-wrap gap-3 items-end">
      <div class="w-full sm:flex-1 sm:min-w-[150px]">
        <CustomSelect
          bind:value={filterPJ}
          options={pjOptions()}
          label="Filter PJ Organik"
          placeholder="Semua PJ Organik"
        />
      </div>
    </div>
  </div>

  <!-- Table -->
  <div class="bg-white rounded-sm shadow-md p-4 sm:p-5 animate-fade-in-up" style="animation-delay: 100ms">
    <div class="overflow-x-auto">
      <table class="w-full text-xs sm:text-sm">
        <thead>
          <tr class="border-b border-gray-200">
            <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">No</th>
            <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">PPL</th>
            <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">Nomor WA</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredList() as item, i (item.namaPpl + item.nomorWa)}
            <tr class="border-b border-gray-100 hover:bg-gray-50 animate-fade-in" style="animation-delay: {i * 40}ms">
              <td class="py-2 px-2 sm:px-3 text-gray-500">{i + 1}</td>
              <td class="py-2 px-2 sm:px-3 text-gray-700">{item.namaPpl}</td>
              <td class="py-2 px-2 sm:px-3">
                {#if item.nomorWa}
                  <a
                    href="https://wa.me/{item.nomorWa}"
                    target="_blank"
                    class="inline-flex items-center gap-1 text-green-600 hover:text-green-800 font-medium transition-colors"
                  >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Kirim Pesan
                  </a>
                {:else}
                  <span class="text-gray-400">-</span>
                {/if}
              </td>
            </tr>
          {/each}
          {#if filteredList().length === 0}
            <tr>
              <td colspan="3" class="py-8 text-center text-gray-500">Tidak ada data</td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>
