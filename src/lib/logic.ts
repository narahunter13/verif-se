import type { MasterItem, TransactionItem } from './types';

export const getUniquePJOrganik = (masterList: MasterItem[]): string[] => {
  const set = new Set(masterList.map((item) => item.pjOrganik));
  return Array.from(set).sort();
};

export const filterByPJOrganik = (masterList: MasterItem[], pjOrganik: string): string[] => {
  const set = new Set(
    masterList
      .filter((item) => item.pjOrganik === pjOrganik)
      .map((item) => item.namaPpl)
  );
  return Array.from(set).sort();
};

export const filterByPPL = (
  masterList: MasterItem[],
  pjOrganik: string,
  namaPpl: string
): string[] => {
  const set = new Set(
    masterList
      .filter((item) => item.pjOrganik === pjOrganik && item.namaPpl === namaPpl)
      .map((item) => item.kecamatan)
  );
  return Array.from(set).sort();
};

export const filterByKecamatan = (
  masterList: MasterItem[],
  pjOrganik: string,
  namaPpl: string,
  kecamatan: string
): string[] => {
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

export const filterByKelurahan = (
  masterList: MasterItem[],
  pjOrganik: string,
  namaPpl: string,
  kecamatan: string,
  kelurahan: string
): string[] => {
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

export const getTarget = (
  masterList: MasterItem[],
  pjOrganik: string,
  namaPpl: string,
  kecamatan: string,
  kelurahan: string,
  sls: string
): number => {
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

export const getTargetFromMaster = (
  masterList: MasterItem[],
  pjOrganik: string,
  namaPpl: string,
  kecamatan: string,
  kelurahan: string,
  sls: string
): number => {
  const m = masterList.find(
    (item) =>
      item.pjOrganik === pjOrganik &&
      item.namaPpl === namaPpl &&
      item.kecamatan === kecamatan &&
      item.kelurahan === kelurahan &&
      item.sls === sls
  );
  return m?.target || 0;
};

export const getUniqueTargetSum = (
  masterList: MasterItem[],
  items: TransactionItem[]
): number => {
  const seen = new Set<string>();
  let total = 0;
  for (const t of items) {
    const key = `${t.pjOrganik}|${t.namaPpl}|${t.kecamatan}|${t.kelurahan}|${t.sls}`;
    if (!seen.has(key)) {
      seen.add(key);
      total += getTargetFromMaster(masterList, t.pjOrganik, t.namaPpl, t.kecamatan, t.kelurahan, t.sls);
    }
  }
  return total;
};

export const aggregateByPPL = (
  masterList: MasterItem[],
  transactions: TransactionItem[]
): Array<{ name: string; target: number; realisasi: number; persentase: number }> => {
  const pplMap = new Map<string, { seenSls: Set<string>; target: number; realisasi: number }>();

  for (const t of transactions) {
    const existing = pplMap.get(t.namaPpl) || { seenSls: new Set<string>(), target: 0, realisasi: 0 };
    const slsKey = `${t.pjOrganik}|${t.namaPpl}|${t.kecamatan}|${t.kelurahan}|${t.sls}`;
    if (!existing.seenSls.has(slsKey)) {
      existing.seenSls.add(slsKey);
      existing.target += getTargetFromMaster(masterList, t.pjOrganik, t.namaPpl, t.kecamatan, t.kelurahan, t.sls);
    }
    existing.realisasi += 1;
    pplMap.set(t.namaPpl, existing);
  }

  return Array.from(pplMap.entries())
    .map(([name, data]) => ({
      name,
      target: data.target,
      realisasi: data.realisasi,
      persentase: data.target > 0 ? Math.round((data.realisasi / data.target) * 100) : 0
    }))
    .sort((a, b) => b.persentase - a.persentase);
};

export const aggregateByKecamatan = (
  masterList: MasterItem[],
  transactions: TransactionItem[]
): Array<{ nama: string; target: number; realisasi: number; persentase: number }> => {
  const kecMap = new Map<string, { seenSls: Set<string>; target: number; realisasi: number }>();

  for (const t of transactions) {
    const existing = kecMap.get(t.kecamatan) || { seenSls: new Set<string>(), target: 0, realisasi: 0 };
    const slsKey = `${t.pjOrganik}|${t.namaPpl}|${t.kecamatan}|${t.kelurahan}|${t.sls}`;
    if (!existing.seenSls.has(slsKey)) {
      existing.seenSls.add(slsKey);
      existing.target += getTargetFromMaster(masterList, t.pjOrganik, t.namaPpl, t.kecamatan, t.kelurahan, t.sls);
    }
    existing.realisasi += 1;
    kecMap.set(t.kecamatan, existing);
  }

  return Array.from(kecMap.entries())
    .map(([nama, data]) => ({
      nama,
      target: data.target,
      realisasi: data.realisasi,
      persentase: data.target > 0 ? Math.round((data.realisasi / data.target) * 100) : 0
    }))
    .sort((a, b) => b.persentase - a.persentase);
};

export const aggregateByKelurahan = (
  masterList: MasterItem[],
  transactions: TransactionItem[],
  kecamatanFilter: string
): Array<{ nama: string; kecamatan: string; target: number; realisasi: number; persentase: number }> => {
  if (!kecamatanFilter) return [];
  const filtered = transactions.filter((t) => t.kecamatan === kecamatanFilter);
  const kelMap = new Map<string, { seenSls: Set<string>; target: number; realisasi: number }>();

  for (const t of filtered) {
    const existing = kelMap.get(t.kelurahan) || { seenSls: new Set<string>(), target: 0, realisasi: 0 };
    const slsKey = `${t.pjOrganik}|${t.namaPpl}|${t.kecamatan}|${t.kelurahan}|${t.sls}`;
    if (!existing.seenSls.has(slsKey)) {
      existing.seenSls.add(slsKey);
      existing.target += getTargetFromMaster(masterList, t.pjOrganik, t.namaPpl, t.kecamatan, t.kelurahan, t.sls);
    }
    existing.realisasi += 1;
    kelMap.set(t.kelurahan, existing);
  }

  return Array.from(kelMap.entries())
    .map(([nama, data]) => ({
      nama,
      kecamatan: kecamatanFilter,
      target: data.target,
      realisasi: data.realisasi,
      persentase: data.target > 0 ? Math.round((data.realisasi / data.target) * 100) : 0
    }))
    .sort((a, b) => b.persentase - a.persentase);
};

export const aggregateBySLS = (
  masterList: MasterItem[],
  transactions: TransactionItem[],
  kelurahanFilter: string
): Array<{ nama: string; kelurahan: string; target: number; realisasi: number; persentase: number }> => {
  if (!kelurahanFilter) return [];
  const filtered = transactions.filter((t) => t.kelurahan === kelurahanFilter);
  const slsMap = new Map<string, { seenSls: Set<string>; target: number; realisasi: number }>();

  for (const t of filtered) {
    const existing = slsMap.get(t.sls) || { seenSls: new Set<string>(), target: 0, realisasi: 0 };
    const slsKey = `${t.pjOrganik}|${t.namaPpl}|${t.kecamatan}|${t.kelurahan}|${t.sls}`;
    if (!existing.seenSls.has(slsKey)) {
      existing.seenSls.add(slsKey);
      existing.target += getTargetFromMaster(masterList, t.pjOrganik, t.namaPpl, t.kecamatan, t.kelurahan, t.sls);
    }
    existing.realisasi += 1;
    slsMap.set(t.sls, existing);
  }

  return Array.from(slsMap.entries())
    .map(([nama, data]) => ({
      nama,
      kelurahan: kelurahanFilter,
      target: data.target,
      realisasi: data.realisasi,
      persentase: data.target > 0 ? Math.round((data.realisasi / data.target) * 100) : 0
    }))
    .sort((a, b) => b.persentase - a.persentase);
};
