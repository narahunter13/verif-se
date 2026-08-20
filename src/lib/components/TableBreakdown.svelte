<script lang="ts">
  interface Column {
    key: string;
    label: string;
  }

  interface RowData {
    [key: string]: string | number;
  }

  let {
    data = [],
    columns = [],
    onRowClick = undefined
  }: {
    data: RowData[];
    columns: Column[];
    onRowClick?: (row: RowData) => void;
  } = $props();
</script>

{#if data.length === 0}
  <p class="text-xs sm:text-sm text-gray-500 text-center py-8">Tidak ada data</p>
{:else}
  <div class="overflow-x-auto">
    <table class="w-full text-xs sm:text-sm">
      <thead>
        <tr class="border-b border-gray-200">
          {#each columns as col}
            <th class="text-left py-2.5 sm:py-3 px-2 font-semibold text-gray-700">
              {col.label}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each data as row, i}
          <tr
            class="border-b border-gray-100 hover:bg-primary-50 transition-all duration-200 animate-fade-in {onRowClick ? 'cursor-pointer active:bg-primary-100' : ''}"
            style="animation-delay: {i * 40}ms"
            onclick={() => onRowClick?.(row)}
          >
            {#each columns as col}
              <td class="py-2 sm:py-3 px-2">
                {#if col.key === 'persentase'}
                  <div class="flex items-center gap-2">
                    <div class="w-14 sm:w-16 bg-gray-200 rounded-sm h-1.5 sm:h-2">
                      <div
                        class="h-1.5 sm:h-2 rounded-sm transition-all duration-500 ease-out {row[col.key] >= 80 ? 'bg-green-500' : row[col.key] >= 50 ? 'bg-yellow-500' : 'bg-red-500'}"
                        style="width: {Math.min(row[col.key], 100)}%"
                      ></div>
                    </div>
                    <span class="font-medium">{row[col.key]}%</span>
                  </div>
                {:else}
                  <span class={col.key === 'nama' ? 'font-medium text-gray-800' : 'text-gray-600'}>
                    {row[col.key]}
                  </span>
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
