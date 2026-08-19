<script lang="ts">
  import { store } from '$lib/state/appState.svelte';
  import { compressImage, formatFileSize } from '$lib/wasm/wasmLoader';
  import type { FormData } from '$lib/types';

  let formData = $state<FormData>({
    pjOrganik: '',
    namaPpl: '',
    kecamatan: '',
    kelurahan: '',
    sls: '',
    target: 0,
    namaResponden: '',
    file: null,
    filePreview: null
  });

  let isCompressing = $state(false);
  let isSubmitting = $state(false);
  let uploadProgress = $state(0);
  let showSuccess = $state(false);
  let showConfirm = $state(false);
  let compressedInfo = $state<{ original: number; compressed: number } | null>(null);

  const pjOrganikOptions = $derived(store.uniquePJOrganik);
  const pplOptions = $derived(
    formData.pjOrganik ? store.filterByPJOrganik(formData.pjOrganik) : []
  );
  const kecamatanOptions = $derived(
    formData.pjOrganik && formData.namaPpl
      ? store.filterByPPL(formData.pjOrganik, formData.namaPpl)
      : []
  );
  const kelurahanOptions = $derived(
    formData.pjOrganik && formData.namaPpl && formData.kecamatan
      ? store.filterByKecamatan(formData.pjOrganik, formData.namaPpl, formData.kecamatan)
      : []
  );
  const slsOptions = $derived(
    formData.pjOrganik && formData.namaPpl && formData.kecamatan && formData.kelurahan
      ? store.filterByKelurahan(
          formData.pjOrganik,
          formData.namaPpl,
          formData.kecamatan,
          formData.kelurahan
        )
      : []
  );

  $effect(() => {
    if (formData.pjOrganik) formData.namaPpl = '';
    if (formData.namaPpl) formData.kecamatan = '';
    if (formData.kecamatan) formData.kelurahan = '';
    if (formData.kelurahan) formData.sls = '';
    if (formData.sls) {
      formData.target = store.getTarget(
        formData.pjOrganik,
        formData.namaPpl,
        formData.kecamatan,
        formData.kelurahan,
        formData.sls
      );
    }
  });

  const handleFileSelect = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    formData.file = file;
    formData.filePreview = URL.createObjectURL(file);

    isCompressing = true;
    try {
      const result = await compressImage(file, 80, 1280);
      compressedInfo = { original: file.size, compressed: result.data.length };
      formData.filePreview = `data:image/jpeg;base64,${result.base64}`;
    } catch (err) {
      console.error('Compression failed:', err);
    } finally {
      isCompressing = false;
    }
  };

  const resetForm = () => {
    formData = {
      pjOrganik: '',
      namaPpl: '',
      kecamatan: '',
      kelurahan: '',
      sls: '',
      target: 0,
      namaResponden: '',
      file: null,
      filePreview: null
    };
    compressedInfo = null;
    showConfirm = false;
  };

  const handleSubmit = async () => {
    if (!formData.file || !formData.sls || !formData.namaResponden) return;

    showConfirm = true;
  };

  const confirmSubmit = async () => {
    showConfirm = false;
    isSubmitting = true;
    uploadProgress = 0;

    try {
      const result = await compressImage(formData.file!, 80, 1280);

      uploadProgress = 50;

      await store.submitData({
        pjOrganik: formData.pjOrganik,
        namaPpl: formData.namaPpl,
        kecamatan: formData.kecamatan,
        kelurahan: formData.kelurahan,
        sls: formData.sls,
        namaResponden: formData.namaResponden,
        fileBase64: result.base64,
        fileType: formData.file!.type
      });

      uploadProgress = 100;
      showSuccess = true;

      setTimeout(() => {
        showSuccess = false;
        resetForm();
      }, 3000);
    } catch (err) {
      console.error('Submit failed:', err);
      alert('Gagal mengirim data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      isSubmitting = false;
      uploadProgress = 0;
    }
  };

  const isFormValid = $derived(
    formData.pjOrganik &&
    formData.namaPpl &&
    formData.kecamatan &&
    formData.kelurahan &&
    formData.sls &&
    formData.namaResponden &&
    formData.file
  );
</script>

<div class="max-w-2xl mx-auto">
  <div class="bg-white rounded-2xl shadow-lg p-6 md:p-8">
    <h1 class="text-2xl md:text-3xl font-bold text-primary-700 mb-6 flex items-center gap-3">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Form Verifikasi Lapangan
    </h1>

    {#if store.isLoading}
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    {:else if store.error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p class="text-red-700">{store.error}</p>
        <button
          onclick={() => store.fetchData()}
          class="mt-2 text-sm text-red-600 underline hover:text-red-800"
        >
          Coba lagi
        </button>
      </div>
    {:else}
      <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <!-- PJ Organik -->
        <div class="mb-4">
          <label for="pjOrganik" class="block text-sm font-medium text-gray-700 mb-1">
            PJ Organik <span class="text-red-500">*</span>
          </label>
          <select
            id="pjOrganik"
            bind:value={formData.pjOrganik}
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
            <option value="">Pilih PJ Organik</option>
            {#each pjOrganikOptions as pj}
              <option value={pj}>{pj}</option>
            {/each}
          </select>
        </div>

        <!-- Nama PPL -->
        <div class="mb-4">
          <label for="namaPpl" class="block text-sm font-medium text-gray-700 mb-1">
            Nama PPL <span class="text-red-500">*</span>
          </label>
          <select
            id="namaPpl"
            bind:value={formData.namaPpl}
            disabled={!formData.pjOrganik}
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Pilih Nama PPL</option>
            {#each pplOptions as ppl}
              <option value={ppl}>{ppl}</option>
            {/each}
          </select>
        </div>

        <!-- Kecamatan -->
        <div class="mb-4">
          <label for="kecamatan" class="block text-sm font-medium text-gray-700 mb-1">
            Kecamatan <span class="text-red-500">*</span>
          </label>
          <select
            id="kecamatan"
            bind:value={formData.kecamatan}
            disabled={!formData.namaPpl}
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Pilih Kecamatan</option>
            {#each kecamatanOptions as kec}
              <option value={kec}>{kec}</option>
            {/each}
          </select>
        </div>

        <!-- Kelurahan -->
        <div class="mb-4">
          <label for="kelurahan" class="block text-sm font-medium text-gray-700 mb-1">
            Kelurahan <span class="text-red-500">*</span>
          </label>
          <select
            id="kelurahan"
            bind:value={formData.kelurahan}
            disabled={!formData.kecamatan}
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Pilih Kelurahan</option>
            {#each kelurahanOptions as kel}
              <option value={kel}>{kel}</option>
            {/each}
          </select>
        </div>

        <!-- SLS -->
        <div class="mb-4">
          <label for="sls" class="block text-sm font-medium text-gray-700 mb-1">
            SLS <span class="text-red-500">*</span>
          </label>
          <select
            id="sls"
            bind:value={formData.sls}
            disabled={!formData.kelurahan}
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Pilih SLS</option>
            {#each slsOptions as sls}
              <option value={sls}>{sls}</option>
            {/each}
          </select>
        </div>

        <!-- Target -->
        <div class="mb-4">
          <label for="target" class="block text-sm font-medium text-gray-700 mb-1">
            Target
          </label>
          <input
            type="number"
            id="target"
            bind:value={formData.target}
            readonly
            class="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
          />
        </div>

        <!-- Nama Responden -->
        <div class="mb-6">
          <label for="namaResponden" class="block text-sm font-medium text-gray-700 mb-1">
            Nama Responden <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="namaResponden"
            bind:value={formData.namaResponden}
            placeholder="Masukkan nama responden"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
        </div>

        <!-- Upload Foto -->
        <div class="mb-6">
          <label for="fileInput" class="block text-sm font-medium text-gray-700 mb-2">
            Foto Verifikasi <span class="text-red-500">*</span>
          </label>
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
            {#if formData.filePreview}
              <div class="mb-4">
                <img
                  src={formData.filePreview}
                  alt="Preview"
                  class="max-h-48 mx-auto rounded-lg shadow-md"
                />
              </div>
              {#if compressedInfo}
                <p class="text-sm text-gray-500 mb-2">
                  Original: {formatFileSize(compressedInfo.original)} → 
                  Kompresi: {formatFileSize(compressedInfo.compressed)}
                  ({((1 - compressedInfo.compressed / compressedInfo.original) * 100).toFixed(0)}% lebih kecil)
                </p>
              {/if}
              <button
                type="button"
                onclick={() => {
                  formData.file = null;
                  formData.filePreview = null;
                  compressedInfo = null;
                }}
                class="text-sm text-red-600 hover:text-red-800 underline"
              >
                Hapus foto
              </button>
            {:else}
              <input
                type="file"
                accept="image/*"
                onchange={handleFileSelect}
                class="hidden"
                id="fileInput"
              />
              <label for="fileInput" class="cursor-pointer">
                <svg class="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="text-gray-600">Klik untuk memilih foto</p>
                <p class="text-sm text-gray-400 mt-1">PNG, JPG, JPEG (Maks 10MB)</p>
              </label>
            {/if}
            {#if isCompressing}
              <div class="mt-4">
                <div class="animate-spin rounded-full h-8 w-8 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
                <p class="text-sm text-gray-500 mt-2">Mengkompresi gambar...</p>
              </div>
            {/if}
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting || isCompressing}
          class="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {#if isSubmitting}
            <div class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            Mengirim...
          {:else}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Kirim Verifikasi
          {/if}
        </button>
      </form>
    {/if}
  </div>
</div>

<!-- Success Toast -->
{#if showSuccess}
  <div class="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-slide-up">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
    </svg>
    <span class="font-medium">Berhasil dikirim!</span>
  </div>
{/if}

<!-- Confirm Modal -->
{#if showConfirm}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
      <h3 class="text-lg font-semibold text-gray-900 mb-2">Konfirmasi Kirim</h3>
      <p class="text-gray-600 mb-4">Pastikan data sudah benar sebelum dikirim.</p>
      <div class="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
        <p><strong>PJ:</strong> {formData.pjOrganik}</p>
        <p><strong>PPL:</strong> {formData.namaPpl}</p>
        <p><strong>Wilayah:</strong> {formData.kecamatan}, {formData.kelurahan}</p>
        <p><strong>SLS:</strong> {formData.sls}</p>
        <p><strong>Responden:</strong> {formData.namaResponden}</p>
      </div>
      <div class="flex gap-3">
        <button
          onclick={() => showConfirm = false}
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Batal
        </button>
        <button
          onclick={confirmSubmit}
          class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Ya, Kirim
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes slide-up {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
</style>
