<script lang="ts">
  interface ChartData {
    name: string;
    target: number;
    realisasi: number;
    persentase: number;
  }

  let { data = [] }: { data: ChartData[] } = $props();

  const maxValue = $derived(() => {
    if (data.length === 0) return 1;
    return Math.max(...data.map((d) => Math.max(d.target, d.realisasi)));
  });

  const barHeight = 32;
  const gap = 12;
  const labelWidth = 120;
  const chartWidth = 600;
  const totalHeight = $derived(() => data.length * (barHeight + gap) + 40);
</script>

{#if data.length === 0}
  <p class="text-xs sm:text-sm text-gray-500 text-center py-8">Tidak ada data untuk ditampilkan</p>
{:else}
  <div class="overflow-x-auto">
    <svg viewBox="0 0 {chartWidth + labelWidth + 40} {totalHeight()}" class="w-full max-w-2xl">
      {#each data as item, i}
        {@const y = i * (barHeight + gap) + 20}
        {@const targetWidth = (item.target / maxValue()) * (chartWidth - 100)}
        {@const realisasiWidth = (item.realisasi / maxValue()) * (chartWidth - 100)}

        <!-- Label -->
        <text
          x={labelWidth - 10}
          y={y + barHeight / 2 + 4}
          text-anchor="end"
          class="text-xs fill-gray-600"
        >
          {item.name.length > 15 ? item.name.slice(0, 15) + '...' : item.name}
        </text>

        <!-- Target Bar (background) -->
        <rect
          x={labelWidth}
          y={y}
          width={targetWidth}
          height={barHeight}
          rx="2"
          class="fill-primary-100"
        />

        <!-- Realisasi Bar with grow animation -->
        <rect
          x={labelWidth}
          y={y}
          width={realisasiWidth}
          height={barHeight}
          rx="2"
          class="fill-primary-500 chart-bar-grow"
          style="animation-delay: {i * 80}ms"
        />

        <!-- Percentage Label -->
        <text
          x={labelWidth + Math.max(targetWidth, realisasiWidth) + 8}
          y={y + barHeight / 2 + 4}
          class="text-xs fill-gray-700 font-medium"
        >
          {item.persentase}%
        </text>

        <!-- Value Label -->
        <text
          x={labelWidth + realisasiWidth / 2}
          y={y + barHeight / 2 + 4}
          text-anchor="middle"
          class="text-xs fill-white font-medium"
        >
          {item.realisasi}/{item.target}
        </text>
      {/each}

      <!-- Legend -->
      <rect x={labelWidth} y={totalHeight() - 15} width="12" height="12" rx="2" class="fill-primary-100" />
      <text x={labelWidth + 16} y={totalHeight() - 5} class="text-xs fill-gray-600">Target</text>
      <rect x={labelWidth + 60} y={totalHeight() - 15} width="12" height="12" rx="2" class="fill-primary-500" />
      <text x={labelWidth + 76} y={totalHeight() - 5} class="text-xs fill-gray-600">Realisasi</text>
    </svg>
  </div>
{/if}

<style>
  @keyframes bar-grow {
    from { width: 0; }
  }
  .chart-bar-grow {
    animation: bar-grow 0.6s ease-out forwards;
  }
</style>
