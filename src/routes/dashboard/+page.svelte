<script lang="ts">
  import { store } from '$lib/state/appState.svelte';
  import ChartProgress from '$lib/components/ChartProgress.svelte';
  import TableBreakdown from '$lib/components/TableBreakdown.svelte';
  import type { KecamatanStats, KelurahanStats, SLSStats } from '$lib/types';

  let filterPPL = $state<string>('');
  let filterKecamatan = $state<string>('');
  let filterKelurahan = $state<string>('');

  const pplList = $derived(() => {
    const set = new Set(store.transactionList.map((t) => t.namaPpl));
    return Array.from(set).sort();
  });

  const filteredTransactions = $derived(() => {
    let data = store.transactionList;
    if (filterPPL) data = data.filter((t) => t.namaPpl === filterPPL);
    if (filterKecamatan) data = data.filter((t) => t.kecamatan === filterKecamatan);
    if (filterKelurahan) data = data.filter((t) => t.kelurahan === filterKelurahan);
    return data;
  });

  const getTargetFromMaster = (
    pjOrganik: string,
    namaPpl: string,
    kecamatan: string,
    kelurahan: string,
    sls: string
  ) => {
    const m = store.masterList.find(
      (item) =>
        item.pjOrganik === pjOrganik &&
        item.namaPpl === namaPpl &&
        item.kecamatan === kecamatan &&
        item.kelurahan === kelurahan &&
        item.sls === sls
    );
    return m?.target || 0;
  };

  const getUniqueTargetSum = (
    items: Array<{ pjOrganik: string; namaPpl: string; kecamatan: string; kelurahan: string; sls: string }>
  ) => {
    const seen = new Set<string>();
    let total = 0;
    for (const t of items) {
      const key = `${t.pjOrganik}|${t.namaPpl}|${t.kecamatan}|${t.kelurahan}|${t.sls}`;
      if (!seen.has(key)) {
        seen.add(key);
        total += getTargetFromMaster(t.pjOrganik, t.namaPpl, t.kecamatan, t.kelurahan, t.sls);
      }
    }
    return total;
  };

  const stats = $derived(() => {
    const transactions = filteredTransactions();
    const totalTarget = getUniqueTargetSum(transactions);
    const totalRealisasi = transactions.length;
    return {
      totalTarget,
      totalRealisasi,
      persentase: totalTarget > 0 ? Math.round((totalRealisasi / totalTarget) * 100) : 0
    };
  });

  const chartData = $derived(() => {
    const transactions = filteredTransactions();
    const pplMap = new Map<string, { target: number; realisasi: number }>();

    for (const t of transactions) {
      const existing = pplMap.get(t.namaPpl) || { target: 0, realisasi: 0 };
      const tgt = getTargetFromMaster(t.pjOrganik, t.namaPpl, t.kecamatan, t.kelurahan, t.sls);
      pplMap.set(t.namaPpl, {
        target: existing.target + tgt,
        realisasi: existing.realisasi + 1
      });
    }

    return Array.from(pplMap.entries())
      .map(([name, data]) => ({
        name,
        target: data.target,
        realisasi: data.realisasi,
        persentase: data.target > 0 ? Math.round((data.realisasi / data.target) * 100) : 0
      }))
      .sort((a, b) => b.persentase - a.persentase);
  });

  const kecamatanStats = $derived(() => {
    const transactions = filteredTransactions();
    const kecMap = new Map<string, { target: number; realisasi: number }>();

    for (const t of transactions) {
      const existing = kecMap.get(t.kecamatan) || { target: 0, realisasi: 0 };
      const tgt = getTargetFromMaster(t.pjOrganik, t.namaPpl, t.kecamatan, t.kelurahan, t.sls);
      kecMap.set(t.kecamatan, {
        target: existing.target + tgt,
        realisasi: existing.realisasi + 1
      });
    }

    return Array.from(kecMap.entries())
      .map(([nama, data]) => ({
        nama,
        target: data.target,
        realisasi: data.realisasi,
        persentase: data.target > 0 ? Math.round((data.realisasi / data.target) * 100) : 0
      }))
      .sort((a, b) => b.persentase - a.persentase) as KecamatanStats[];
  });

  const kelurahanStats = $derived(() => {
    if (!filterKecamatan) return [];
    const transactions = filteredTransactions().filter((t) => t.kecamatan === filterKecamatan);
    const kelMap = new Map<string, { target: number; realisasi: number }>();

    for (const t of transactions) {
      const existing = kelMap.get(t.kelurahan) || { target: 0, realisasi: 0 };
      const tgt = getTargetFromMaster(t.pjOrganik, t.namaPpl, t.kecamatan, t.kelurahan, t.sls);
      kelMap.set(t.kelurahan, {
        target: existing.target + tgt,
        realisasi: existing.realisasi + 1
      });
    }

    return Array.from(kelMap.entries())
      .map(([nama, data]) => ({
        nama,
        kecamatan: filterKecamatan,
        target: data.target,
        realisasi: data.realisasi,
        persentase: data.target > 0 ? Math.round((data.realisasi / data.target) * 100) : 0
      }))
      .sort((a, b) => b.persentase - a.persentase) as KelurahanStats[];
  });

  const slsStats = $derived(() => {
    if (!filterKelurahan) return [];
    const transactions = filteredTransactions().filter(
      (t) => t.kelurahan === filterKelurahan
    );
    const slsMap = new Map<string, { target: number; realisasi: number }>();

    for (const t of transactions) {
      const existing = slsMap.get(t.sls) || { target: 0, realisasi: 0 };
      const tgt = getTargetFromMaster(t.pjOrganik, t.namaPpl, t.kecamatan, t.kelurahan, t.sls);
      slsMap.set(t.sls, {
        target: existing.target + tgt,
        realisasi: existing.realisasi + 1
      });
    }

    return Array.from(slsMap.entries())
      .map(([nama, data]) => ({
        nama,
        kelurahan: filterKelurahan,
        target: data.target,
        realisasi: data.realisasi,
        persentase: data.target > 0 ? Math.round((data.realisasi / data.target) * 100) : 0
      }))
      .sort((a, b) => b.persentase - a.persentase) as SLSStats[];
  });

  const resetFilters = () => {
    filterPPL = '';
    filterKecamatan = '';
    filterKelurahan = '';
  };
</script>

<div class="max-w-6xl mx-auto">
  <div class="mb-6">
    <h1 class="text-2xl md:text-3xl font-bold text-primary-700 flex items-center gap-3">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      Dashboard Monitoring
    </h1>
    <p class="text-gray-600 mt-2">Pantau progress verifikasi lapangan secara real-time</p>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-primary-500">
      <p class="text-sm text-gray-500 mb-1">Total Target</p>
      <p class="text-3xl font-bold text-primary-600">{stats().totalTarget}</p>
    </div>
    <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
      <p class="text-sm text-gray-500 mb-1">Total Realisasi</p>
      <p class="text-3xl font-bold text-green-600">{stats().totalRealisasi}</p>
    </div>
    <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
      <p class="text-sm text-gray-500 mb-1">Persentase</p>
      <p class="text-3xl font-bold text-blue-600">{stats().persentase}%</p>
    </div>
  </div>

  <!-- Filters -->
  <div class="bg-white rounded-xl shadow-md p-4 mb-6">
    <div class="flex flex-wrap gap-4 items-end">
      <div class="flex-1 min-w-[150px]">
        <label for="filterPPL" class="block text-sm font-medium text-gray-700 mb-1">Filter PPL</label>
        <select
          id="filterPPL"
          bind:value={filterPPL}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Semua PPL</option>
          {#each pplList() as ppl}
            <option value={ppl}>{ppl}</option>
          {/each}
        </select>
      </div>
      <div class="flex-1 min-w-[150px]">
        <label for="filterKec" class="block text-sm font-medium textgray-700 mb-1">Filter Kecamatan</label>
        <select
          id="filterKec"
          bind:value={filterKecamatan}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Semua Kecamatan</option>
          {#each kecamatanStats() as kec}
            <option value={kec.nama}>{kec.nama}</option>
          {/each}
        </select>
      </div>
      <div class="flex-1 min-w-[150px]">
        <label for="filterKel" class="block text-sm font-medium text-gray-700 mb-1">Filter Kelurahan</label>
        <select
          id="filterKel"
          bind:value={filterKelurahan}
          disabled={!filterKecamatan}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
        >
          <option value="">Semua Kelurahan</option>
          {#each kelurahanStats() as kel}
            <option value={kel.nama}>{kel.nama}</option>
          {/each}
        </select>
      </div>
      <button
        onclick={resetFilters}
        class="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
      >
        Reset
      </button>
    </div>
  </div>

  <!-- Chart -->
  <div class="bg-white rounded-xl shadow-md p-6 mb-6">
    <h2 class="text-lg font-semibold text-gray-800 mb-4">Progress per PPL</h2>
    <ChartProgress data={chartData()} />
  </div>

  <!-- Breakdown Tables -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Kecamatan -->
    <div class="bg-white rounded-xl shadow-md p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Breakdown Kecamatan</h2>
      <TableBreakdown
        data={kecamatanStats()}
        columns={[
          { key: 'nama', label: 'Kecamatan' },
          { key: 'target', label: 'Target' },
          { key: 'realisasi', label: 'Realisasi' },
          { key: 'persentase', label: '% Progress' }
        ]}
        onRowClick={(row) => { filterKecamatan = row.nama; }}
      />
    </div>

    <!-- Kelurahan -->
    <div class="bg-white rounded-xl shadow-md p-6">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Breakdown Kelurahan</h2>
      {#if filterKecamatan}
        <TableBreakdown
          data={kelurahanStats()}
          columns={[
            { key: 'nama', label: 'Kelurahan' },
            { key: 'target', label: 'Target' },
            { key: 'realisasi', label: 'Realisasi' },
            { key: 'persentase', label: '% Progress' }
          ]}
          onRowClick={(row) => { filterKelurahan = row.nama; }}
        />
      {:else}
        <p class="text-gray-500 text-center py-8">Pilih kecamatan untuk melihat detail</p>
      {/if}
    </div>

    <!-- SLS -->
    {#if filterKelurahan}
      <div class="bg-white rounded-xl shadow-md p-6 lg:col-span-2">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Breakdown SLS - {filterKelurahan}</h2>
        <TableBreakdown
          data={slsStats()}
          columns={[
            { key: 'nama', label: 'SLS' },
            { key: 'target', label: 'Target' },
            { key: 'realisasi', label: 'Realisasi' },
            { key: 'persentase', label: '% Progress' }
          ]}
        />
      </div>
    {/if}
  </div>
</div>
