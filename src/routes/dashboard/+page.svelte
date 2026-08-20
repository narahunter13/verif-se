<script lang="ts">
  import { store } from '$lib/state/appState.svelte';
  import ChartProgress from '$lib/components/ChartProgress.svelte';
  import CustomSelect from '$lib/components/CustomSelect.svelte';
  import type { KecamatanStats, KelurahanStats, SLSStats, RespondenCountItem, DailyReportItem } from '$lib/types';

  let activeTab = $state<'response' | 'responden' | 'harian'>('response');

  // ========== TAB 1: DAFTAR RESPONSE ==========
  let filterPJ = $state<string>('');
  let filterPPL = $state<string>('');
  let filterKecamatan = $state<string>('');
  let filterKelurahan = $state<string>('');
  let filterSls = $state<string>('');
  let responsePage = $state(1);
  const responsePerPage = 10;

  const pjOrganikList = $derived(() => {
    const set = new Set(store.transactionList.map((t) => t.pjOrganik));
    return Array.from(set).sort();
  });

  const pplList = $derived(() => {
    let data = store.transactionList;
    if (filterPJ) data = data.filter((t) => t.pjOrganik === filterPJ);
    const set = new Set(data.map((t) => t.namaPpl));
    return Array.from(set).sort();
  });

  const kecamatanList = $derived(() => {
    let data = store.transactionList;
    if (filterPJ) data = data.filter((t) => t.pjOrganik === filterPJ);
    if (filterPPL) data = data.filter((t) => t.namaPpl === filterPPL);
    const set = new Set(data.map((t) => t.kecamatan));
    return Array.from(set).sort();
  });

  const kelurahanList = $derived(() => {
    let data = store.transactionList;
    if (filterPJ) data = data.filter((t) => t.pjOrganik === filterPJ);
    if (filterPPL) data = data.filter((t) => t.namaPpl === filterPPL);
    if (filterKecamatan) data = data.filter((t) => t.kecamatan === filterKecamatan);
    const set = new Set(data.map((t) => t.kelurahan));
    return Array.from(set).sort();
  });

  const slsList = $derived(() => {
    let data = store.transactionList;
    if (filterPJ) data = data.filter((t) => t.pjOrganik === filterPJ);
    if (filterPPL) data = data.filter((t) => t.namaPpl === filterPPL);
    if (filterKecamatan) data = data.filter((t) => t.kecamatan === filterKecamatan);
    if (filterKelurahan) data = data.filter((t) => t.kelurahan === filterKelurahan);
    const set = new Set(data.map((t) => t.sls));
    return Array.from(set).sort();
  });

  const filteredTransactions = $derived(() => {
    let data = store.transactionList;
    if (filterPJ) data = data.filter((t) => t.pjOrganik === filterPJ);
    if (filterPPL) data = data.filter((t) => t.namaPpl === filterPPL);
    if (filterKecamatan) data = data.filter((t) => t.kecamatan === filterKecamatan);
    if (filterKelurahan) data = data.filter((t) => t.kelurahan === filterKelurahan);
    if (filterSls) data = data.filter((t) => t.sls === filterSls);
    return data.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  });

  const responseTotalPages = $derived(() => Math.ceil(filteredTransactions().length / responsePerPage));
  const responsePaginated = $derived(() => {
    const start = (responsePage - 1) * responsePerPage;
    return filteredTransactions().slice(start, start + responsePerPage);
  });

  const resetResponseFilters = () => {
    filterPJ = '';
    filterPPL = '';
    filterKecamatan = '';
    filterKelurahan = '';
    filterSls = '';
    responsePage = 1;
  };

  // Stats for response tab
  const stats = $derived(() => {
    const transactions = filteredTransactions();
    return {
      totalRealisasi: transactions.length
    };
  });

  // Chart data
  const chartData = $derived(() => {
    const transactions = filteredTransactions();
    const pplMap = new Map<string, number>();
    for (const t of transactions) {
      pplMap.set(t.namaPpl, (pplMap.get(t.namaPpl) || 0) + 1);
    }
    return Array.from(pplMap.entries())
      .map(([name, count]) => ({ name, target: 0, realisasi: count, persentase: 0 }))
      .sort((a, b) => b.realisasi - a.realisasi);
  });

  // ========== TAB 2: JUMLAH RESPONDEN ==========
  let filterRespondenPJ = $state<string>('');

  const pjOrganikOptions = $derived(() => {
    const set = new Set(store.transactionList.map((t) => t.pjOrganik));
    return Array.from(set).sort();
  });

  const respondenCounts = $derived(() => {
    let data = store.transactionList;
    if (filterRespondenPJ) data = data.filter((t) => t.pjOrganik === filterRespondenPJ);

    const map = new Map<string, RespondenCountItem>();
    for (const t of data) {
      const key = `${t.pjOrganik}|${t.namaPpl}|${t.kecamatan}|${t.kelurahan}|${t.sls}`;
      if (map.has(key)) {
        map.get(key)!.jumlah++;
      } else {
        map.set(key, {
          pjOrganik: t.pjOrganik,
          namaPpl: t.namaPpl,
          kecamatan: t.kecamatan,
          kelurahan: t.kelurahan,
          sls: t.sls,
          jumlah: 1
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.namaPpl.localeCompare(b.namaPpl) ||
      a.kecamatan.localeCompare(b.kecamatan) ||
      a.kelurahan.localeCompare(b.kelurahan) ||
      a.sls.localeCompare(b.sls)
    );
  });

  // ========== TAB 3: LAPORAN HARIAN ==========
  let filterHarianPJ = $state<string>('');

  const harianPJOptions = $derived(() => {
    const set = new Set(store.transactionList.map((t) => t.pjOrganik));
    return Array.from(set).sort();
  });

  const dailyReports = $derived(() => {
    let data = store.transactionList;
    if (filterHarianPJ) data = data.filter((t) => t.pjOrganik === filterHarianPJ);

    const map = new Map<string, DailyReportItem>();
    for (const t of data) {
      const tanggal = t.timestamp.substring(0, 10);
      const key = `${tanggal}|${t.namaPpl}|${t.sls}`;
      if (map.has(key)) {
        map.get(key)!.jumlah++;
      } else {
        map.set(key, {
          tanggal,
          namaPpl: t.namaPpl,
          sls: t.sls,
          jumlah: 1
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      b.tanggal.localeCompare(a.tanggal) ||
      a.namaPpl.localeCompare(b.namaPpl)
    );
  });
</script>

<div class="max-w-6xl mx-auto">
  <div class="mb-5 animate-fade-in-up">
    <h1 class="text-lg sm:text-xl md:text-2xl font-bold text-primary-700 flex items-center gap-2 sm:gap-3">
      <svg class="w-6 h-6 sm:w-7 sm:h-7 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      Dashboard Monitoring
    </h1>
    <p class="text-xs sm:text-sm text-gray-600 mt-1">Pantau progress verifikasi lapangan secara real-time</p>
  </div>

  <!-- Tab Switcher -->
  <div class="flex gap-1 mb-5 bg-white rounded-sm shadow-md p-1 animate-fade-in-up" style="animation-delay: 50ms">
    <button
      onclick={() => activeTab = 'response'}
      class="flex-1 py-2 px-3 text-xs sm:text-sm font-medium rounded-sm transition-all duration-200 {activeTab === 'response' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}"
    >
      Daftar Response
    </button>
    <button
      onclick={() => activeTab = 'responden'}
      class="flex-1 py-2 px-3 text-xs sm:text-sm font-medium rounded-sm transition-all duration-200 {activeTab === 'responden' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}"
    >
      Jumlah Responden
    </button>
    <button
      onclick={() => activeTab = 'harian'}
      class="flex-1 py-2 px-3 text-xs sm:text-sm font-medium rounded-sm transition-all duration-200 {activeTab === 'harian' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}"
    >
      Laporan Harian
    </button>
  </div>

  {#if activeTab === 'response'}
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-1 gap-3 sm:gap-4 mb-5">
      <div class="bg-white rounded-sm shadow-md p-4 sm:p-5 border-l-4 border-green-500 animate-fade-in-up" style="animation-delay: 100ms">
        <p class="text-xs sm:text-sm text-gray-500 mb-1">Total Realisasi</p>
        <p class="text-2xl sm:text-3xl font-bold text-green-600">{stats().totalRealisasi}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-sm shadow-md p-3 sm:p-4 mb-5 animate-fade-in-up" style="animation-delay: 150ms">
      <div class="flex flex-col sm:flex-row flex-wrap gap-3 items-end">
        <div class="w-full sm:flex-1 sm:min-w-[150px]">
          <CustomSelect
            bind:value={filterPJ}
            options={pjOrganikList()}
            label="Filter PJ Organik"
            placeholder="Semua PJ Organik"
          />
        </div>
        <div class="w-full sm:flex-1 sm:min-w-[150px]">
          <CustomSelect
            bind:value={filterPPL}
            options={pplList()}
            label="Filter PPL"
            placeholder="Semua PPL"
          />
        </div>
        <div class="w-full sm:flex-1 sm:min-w-[150px]">
          <CustomSelect
            bind:value={filterKecamatan}
            options={kecamatanList()}
            label="Filter Kecamatan"
            placeholder="Semua Kecamatan"
          />
        </div>
        <div class="w-full sm:flex-1 sm:min-w-[150px]">
          <CustomSelect
            bind:value={filterKelurahan}
            options={kelurahanList()}
            label="Filter Kelurahan"
            placeholder="Semua Kelurahan"
            disabled={!filterKecamatan}
          />
        </div>
        <div class="w-full sm:flex-1 sm:min-w-[150px]">
          <CustomSelect
            bind:value={filterSls}
            options={slsList()}
            label="Filter SLS"
            placeholder="Semua SLS"
            disabled={!filterKelurahan}
          />
        </div>
        <button
          onclick={resetResponseFilters}
          class="px-3 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-sm transition-all duration-200 active:scale-[0.98] whitespace-nowrap"
        >
          Reset
        </button>
      </div>
    </div>

    <!-- Chart -->
    {#if chartData().length > 0}
      <div class="bg-white rounded-sm shadow-md p-4 sm:p-6 mb-5 animate-fade-in-up" style="animation-delay: 200ms">
        <h2 class="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3">Progress per PPL</h2>
        <ChartProgress data={chartData()} />
      </div>
    {/if}

    <!-- Response Table -->
    <div class="bg-white rounded-sm shadow-md p-4 sm:p-5 animate-fade-in-up" style="animation-delay: 250ms">
      <h2 class="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3">Daftar Response PPL</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-xs sm:text-sm">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">No</th>
              <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">Timestamp</th>
              <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">PJ Organik</th>
              <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">PPL</th>
              <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">Kecamatan</th>
              <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">Kelurahan</th>
              <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">SLS</th>
              <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">Responden</th>
              <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">Foto</th>
            </tr>
          </thead>
          <tbody>
            {#each responsePaginated() as t, i (t.timestamp + t.namaResponden)}
              <tr class="border-b border-gray-100 hover:bg-gray-50 animate-fade-in" style="animation-delay: {i * 40}ms">
                <td class="py-2 px-2 sm:px-3 text-gray-500">{(responsePage - 1) * responsePerPage + i + 1}</td>
                <td class="py-2 px-2 sm:px-3 text-gray-700">{t.timestamp}</td>
                <td class="py-2 px-2 sm:px-3 text-gray-700">{t.pjOrganik}</td>
                <td class="py-2 px-2 sm:px-3 text-gray-700">{t.namaPpl}</td>
                <td class="py-2 px-2 sm:px-3 text-gray-700">{t.kecamatan}</td>
                <td class="py-2 px-2 sm:px-3 text-gray-700">{t.kelurahan}</td>
                <td class="py-2 px-2 sm:px-3 text-gray-700">{t.sls}</td>
                <td class="py-2 px-2 sm:px-3 text-gray-700">{t.namaResponden}</td>
                <td class="py-2 px-2 sm:px-3">
                  {#if t.urlFoto}
                    <a href={t.urlFoto} target="_blank" class="text-primary-600 hover:text-primary-800 underline">Lihat Foto</a>
                  {:else}
                    <span class="text-gray-400">-</span>
                  {/if}
                </td>
              </tr>
            {/each}
            {#if responsePaginated().length === 0}
              <tr>
                <td colspan="9" class="py-8 text-center text-gray-500">Tidak ada data</td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      {#if responseTotalPages() > 1}
        <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
          <p class="text-xs sm:text-sm text-gray-500">
            Menampilkan {(responsePage - 1) * responsePerPage + 1}-{Math.min(responsePage * responsePerPage, filteredTransactions().length)} dari {filteredTransactions().length}
          </p>
          <div class="flex gap-1">
            <button
              onclick={() => responsePage = Math.max(1, responsePage - 1)}
              disabled={responsePage === 1}
              class="px-2 py-1 text-xs sm:text-sm rounded-sm border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Prev
            </button>
            {#each Array.from({ length: responseTotalPages() }, (_, i) => i + 1) as page}
              <button
                onclick={() => responsePage = page}
                class="px-2 py-1 text-xs sm:text-sm rounded-sm border transition-all duration-200 {responsePage === page ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50'}"
              >
                {page}
              </button>
            {/each}
            <button
              onclick={() => responsePage = Math.min(responseTotalPages(), responsePage + 1)}
              disabled={responsePage === responseTotalPages()}
              class="px-2 py-1 text-xs sm:text-sm rounded-sm border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Next
            </button>
          </div>
        </div>
      {/if}
    </div>

  {:else if activeTab === 'responden'}
    <!-- Jumlah Responden Filters -->
    <div class="bg-white rounded-sm shadow-md p-3 sm:p-4 mb-5 animate-fade-in-up" style="animation-delay: 100ms">
      <div class="flex flex-col sm:flex-row flex-wrap gap-3 items-end">
        <div class="w-full sm:flex-1 sm:min-w-[150px]">
          <CustomSelect
            bind:value={filterRespondenPJ}
            options={pjOrganikOptions()}
            label="Filter PJ Organik"
            placeholder="Semua PJ Organik"
          />
        </div>
      </div>
    </div>

    <!-- Jumlah Responden Table -->
    <div class="bg-white rounded-sm shadow-md p-4 sm:p-5 animate-fade-in-up" style="animation-delay: 150ms">
      <h2 class="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3">Jumlah Responden per Petugas</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-xs sm:text-sm">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">No</th>
              <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">PJ Organik</th>
              <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">PPL</th>
              <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">Kecamatan</th>
              <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">Kelurahan</th>
              <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">SLS</th>
              <th class="text-right py-2 px-2 sm:px-3 font-medium text-gray-600">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {#each respondenCounts() as item, i (item.pjOrganik + item.namaPpl + item.kecamatan + item.kelurahan + item.sls)}
              <tr class="border-b border-gray-100 hover:bg-gray-50 animate-fade-in" style="animation-delay: {i * 40}ms">
                <td class="py-2 px-2 sm:px-3 text-gray-500">{i + 1}</td>
                <td class="py-2 px-2 sm:px-3 text-gray-700">{item.pjOrganik}</td>
                <td class="py-2 px-2 sm:px-3 text-gray-700">{item.namaPpl}</td>
                <td class="py-2 px-2 sm:px-3 text-gray-700">{item.kecamatan}</td>
                <td class="py-2 px-2 sm:px-3 text-gray-700">{item.kelurahan}</td>
                <td class="py-2 px-2 sm:px-3 text-gray-700">{item.sls}</td>
                <td class="py-2 px-2 sm:px-3 text-right font-semibold text-primary-600">{item.jumlah}</td>
              </tr>
            {/each}
            {#if respondenCounts().length === 0}
              <tr>
                <td colspan="7" class="py-8 text-center text-gray-500">Tidak ada data</td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>

  {:else if activeTab === 'harian'}
    <!-- Laporan Harian Filters -->
    <div class="bg-white rounded-sm shadow-md p-3 sm:p-4 mb-5 animate-fade-in-up" style="animation-delay: 100ms">
      <div class="flex flex-col sm:flex-row flex-wrap gap-3 items-end">
        <div class="w-full sm:flex-1 sm:min-w-[150px]">
          <CustomSelect
            bind:value={filterHarianPJ}
            options={harianPJOptions()}
            label="Filter PJ Organik"
            placeholder="Semua PJ Organik"
          />
        </div>
      </div>
    </div>

    <!-- Laporan Harian Table -->
    <div class="bg-white rounded-sm shadow-md p-4 sm:p-5 animate-fade-in-up" style="animation-delay: 150ms">
      <h2 class="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3">Laporan Harian per PPL per SLS</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-xs sm:text-sm">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">No</th>
              <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">Tanggal</th>
              <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">PPL</th>
              <th class="text-left py-2 px-2 sm:px-3 font-medium text-gray-600">SLS</th>
              <th class="text-right py-2 px-2 sm:px-3 font-medium text-gray-600">Jumlah Upload</th>
            </tr>
          </thead>
          <tbody>
            {#each dailyReports() as item, i (item.tanggal + item.namaPpl + item.sls)}
              <tr class="border-b border-gray-100 hover:bg-gray-50 animate-fade-in" style="animation-delay: {i * 40}ms">
                <td class="py-2 px-2 sm:px-3 text-gray-500">{i + 1}</td>
                <td class="py-2 px-2 sm:px-3 text-gray-700">{item.tanggal}</td>
                <td class="py-2 px-2 sm:px-3 text-gray-700">{item.namaPpl}</td>
                <td class="py-2 px-2 sm:px-3 text-gray-700">{item.sls}</td>
                <td class="py-2 px-2 sm:px-3 text-right font-semibold text-primary-600">{item.jumlah}</td>
              </tr>
            {/each}
            {#if dailyReports().length === 0}
              <tr>
                <td colspan="5" class="py-8 text-center text-gray-500">Tidak ada data</td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
