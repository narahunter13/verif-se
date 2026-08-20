import type { MasterItem, TransactionItem, NomorWaItem } from '$lib/types';

const GAS_WEB_APP_URL = import.meta.env.VITE_GAS_WEB_APP_URL || '';

const createStore = () => {
  let masterList = $state<MasterItem[]>([]);
  let transactionList = $state<TransactionItem[]>([]);
  let nomorWaList = $state<NomorWaItem[]>([]);
  let isLoading = $state<boolean>(false);
  let error = $state<string | null>(null);

  const uniquePJOrganik = $derived(() => {
    const set = new Set(masterList.map((item) => item.pjOrganik));
    return Array.from(set).sort();
  });

  const filterByPJOrganik = (pjOrganik: string) => {
    const set = new Set(
      masterList
        .filter((item) => item.pjOrganik === pjOrganik)
        .map((item) => item.namaPpl)
    );
    return Array.from(set).sort();
  };

  const filterByPPL = (pjOrganik: string, namaPpl: string) => {
    const set = new Set(
      masterList
        .filter((item) => item.pjOrganik === pjOrganik && item.namaPpl === namaPpl)
        .map((item) => item.kecamatan)
    );
    return Array.from(set).sort();
  };

  const filterByKecamatan = (pjOrganik: string, namaPpl: string, kecamatan: string) => {
    const set = new Set(
      masterList
        .filter(
          (item) =>
            item.pjOrganik === pjOrganik &&
            item.namaPpl === namaPpl &&
            item.kecamatan === kecamatan
        )
        .map((item) => item.kelurahan)
    );
    return Array.from(set).sort();
  };

  const filterByKelurahan = (
    pjOrganik: string,
    namaPpl: string,
    kecamatan: string,
    kelurahan: string
  ) => {
    const set = new Set(
      masterList
        .filter(
          (item) =>
            item.pjOrganik === pjOrganik &&
            item.namaPpl === namaPpl &&
            item.kecamatan === kecamatan &&
            item.kelurahan === kelurahan
        )
        .map((item) => item.sls)
    );
    return Array.from(set).sort();
  };

  const getTarget = (
    pjOrganik: string,
    namaPpl: string,
    kecamatan: string,
    kelurahan: string,
    sls: string
  ) => {
    const item = masterList.find(
      (m) =>
        m.pjOrganik === pjOrganik &&
        m.namaPpl === namaPpl &&
        m.kecamatan === kecamatan &&
        m.kelurahan === kelurahan &&
        m.sls === sls
    );
    return item?.target || 0;
  };

  const fetchData = async () => {
    if (!GAS_WEB_APP_URL) {
      error = 'GAS Web App URL belum dikonfigurasi';
      return;
    }

    isLoading = true;
    error = null;

    try {
      const res = await fetch(`${GAS_WEB_APP_URL}?action=getInitialData`);
      const data = await res.json();

      masterList = data.master.map((row: unknown[]) => ({
        pjOrganik: String(row[0] || ''),
        namaPpl: String(row[1] || ''),
        kecamatan: String(row[2] || ''),
        kelurahan: String(row[3] || ''),
        sls: String(row[4] || ''),
        target: Number(row[5]) || 0
      }));

      transactionList = data.transactions.map((row: unknown[]) => ({
        timestamp: String(row[0] || ''),
        pjOrganik: String(row[1] || ''),
        namaPpl: String(row[2] || ''),
        kecamatan: String(row[3] || ''),
        kelurahan: String(row[4] || ''),
        sls: String(row[5] || ''),
        namaResponden: String(row[6] || ''),
        urlFoto: String(row[7] || '')
      }));

      nomorWaList = (data.nomorWa || []).map((row: unknown[]) => ({
        pjOrganik: String(row[0] || ''),
        namaPpl: String(row[1] || ''),
        nomorWa: String(row[2] || '')
      }));
    } catch (e) {
      error = e instanceof Error ? e.message : 'Gagal mengambil data';
    } finally {
      isLoading = false;
    }
  };

  const submitData = async (formData: {
    pjOrganik: string;
    namaPpl: string;
    kecamatan: string;
    kelurahan: string;
    sls: string;
    namaResponden: string;
    fileBase64: string;
    fileType: string;
  }) => {
    if (!GAS_WEB_APP_URL) {
      throw new Error('GAS Web App URL belum dikonfigurasi');
    }

    const res = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(formData)
    });

    const result = await res.json();

    if (result.status === 'error') {
      throw new Error(result.message);
    }

    await fetchData();

    return result;
  };

  return {
    get masterList() {
      return masterList;
    },
    get transactionList() {
      return transactionList;
    },
    get nomorWaList() {
      return nomorWaList;
    },
    get isLoading() {
      return isLoading;
    },
    get error() {
      return error;
    },
    get uniquePJOrganik() {
      return uniquePJOrganik();
    },
    filterByPJOrganik,
    filterByPPL,
    filterByKecamatan,
    filterByKelurahan,
    getTarget,
    fetchData,
    submitData
  };
};

export const store = createStore();
