import { describe, it, expect } from 'vitest';
import type { MasterItem, TransactionItem } from '../types';
import {
  aggregateByPPL,
  aggregateByKecamatan,
  aggregateByKelurahan,
  aggregateBySLS,
  countByResponden,
  aggregateDailyReport
} from '../logic';

const masterData: MasterItem[] = [
  { pjOrganik: 'PJ_A', namaPpl: 'PPL_1', kecamatan: 'KEC_1', kelurahan: 'KEL_1', sls: 'SLS_1A', target: 10 },
  { pjOrganik: 'PJ_A', namaPpl: 'PPL_1', kecamatan: 'KEC_1', kelurahan: 'KEL_1', sls: 'SLS_1B', target: 15 },
  { pjOrganik: 'PJ_A', namaPpl: 'PPL_1', kecamatan: 'KEC_1', kelurahan: 'KEL_2', sls: 'SLS_2A', target: 20 },
  { pjOrganik: 'PJ_A', namaPpl: 'PPL_2', kecamatan: 'KEC_2', kelurahan: 'KEL_3', sls: 'SLS_3A', target: 12 },
  { pjOrganik: 'PJ_B', namaPpl: 'PPL_3', kecamatan: 'KEC_3', kelurahan: 'KEL_4', sls: 'SLS_4A', target: 8 },
  { pjOrganik: 'PJ_B', namaPpl: 'PPL_3', kecamatan: 'KEC_3', kelurahan: 'KEL_4', sls: 'SLS_4B', target: 5 },
];

const transactions: TransactionItem[] = [
  { timestamp: '2026-08-01 10:00:00', pjOrganik: 'PJ_A', namaPpl: 'PPL_1', kecamatan: 'KEC_1', kelurahan: 'KEL_1', sls: 'SLS_1A', namaResponden: 'R1', urlFoto: 'url1' },
  { timestamp: '2026-08-01 11:00:00', pjOrganik: 'PJ_A', namaPpl: 'PPL_1', kecamatan: 'KEC_1', kelurahan: 'KEL_1', sls: 'SLS_1A', namaResponden: 'R2', urlFoto: 'url2' },
  { timestamp: '2026-08-01 12:00:00', pjOrganik: 'PJ_A', namaPpl: 'PPL_1', kecamatan: 'KEC_1', kelurahan: 'KEL_1', sls: 'SLS_1B', namaResponden: 'R3', urlFoto: 'url3' },
  { timestamp: '2026-08-01 13:00:00', pjOrganik: 'PJ_A', namaPpl: 'PPL_2', kecamatan: 'KEC_2', kelurahan: 'KEL_3', sls: 'SLS_3A', namaResponden: 'R4', urlFoto: 'url4' },
  { timestamp: '2026-08-01 14:00:00', pjOrganik: 'PJ_B', namaPpl: 'PPL_3', kecamatan: 'KEC_3', kelurahan: 'KEL_4', sls: 'SLS_4A', namaResponden: 'R5', urlFoto: 'url5' },
];

describe('Dashboard Aggregation - aggregateByPPL', () => {
  it('should aggregate realisasi per PPL', () => {
    const result = aggregateByPPL(masterData, transactions);
    expect(result).toHaveLength(3);

    const ppl1 = result.find((r) => r.name === 'PPL_1');
    expect(ppl1).toBeDefined();
    expect(ppl1!.realisasi).toBe(3);
    expect(ppl1!.target).toBe(25); // SLS_1A(10) + SLS_1A(10) + SLS_1B(15)
    expect(ppl1!.persentase).toBe(12); // 3/25 * 100 = 12
  });

  it('should sort by persentase descending', () => {
    const result = aggregateByPPL(masterData, transactions);
    expect(result[0].persentase).toBeGreaterThanOrEqual(result[1].persentase);
  });
});

describe('Dashboard Aggregation - aggregateByKecamatan', () => {
  it('should aggregate realisasi per kecamatan', () => {
    const result = aggregateByKecamatan(masterData, transactions);
    expect(result).toHaveLength(3);

    const kec1 = result.find((r) => r.nama === 'KEC_1');
    expect(kec1).toBeDefined();
    expect(kec1!.realisasi).toBe(3);
    expect(kec1!.target).toBe(25); // SLS_1A(10) + SLS_1A(10) + SLS_1B(15)
  });
});

describe('Dashboard Aggregation - aggregateByKelurahan', () => {
  it('should aggregate kelurahan within kecamatan filter', () => {
    const result = aggregateByKelurahan(masterData, transactions, 'KEC_1');
    expect(result).toHaveLength(1); // Only KEL_1 has transactions in KEC_1

    const kel1 = result.find((r) => r.nama === 'KEL_1');
    expect(kel1).toBeDefined();
    expect(kel1!.realisasi).toBe(3);
    expect(kel1!.target).toBe(25);
    expect(kel1!.kecamatan).toBe('KEC_1');
  });

  it('should return empty when no kecamatan filter', () => {
    expect(aggregateByKelurahan(masterData, transactions, '')).toEqual([]);
  });
});

describe('Dashboard Aggregation - aggregateBySLS', () => {
  it('should aggregate SLS within kelurahan filter', () => {
    const result = aggregateBySLS(masterData, transactions, 'KEL_1');
    expect(result).toHaveLength(2); // SLS_1A and SLS_1B

    const sls1a = result.find((r) => r.nama === 'SLS_1A');
    expect(sls1a).toBeDefined();
    expect(sls1a!.realisasi).toBe(2);
    expect(sls1a!.target).toBe(10);
    expect(sls1a!.persentase).toBe(20); // 2/10 * 100 = 20

    const sls1b = result.find((r) => r.nama === 'SLS_1B');
    expect(sls1b).toBeDefined();
    expect(sls1b!.realisasi).toBe(1);
    expect(sls1b!.target).toBe(15);
  });

  it('should return empty when no kelurahan filter', () => {
    expect(aggregateBySLS(masterData, transactions, '')).toEqual([]);
  });
});

describe('Dashboard - Empty Data', () => {
  it('should handle empty transactions', () => {
    const pplResult = aggregateByPPL(masterData, []);
    expect(pplResult).toEqual([]);

    const kecResult = aggregateByKecamatan(masterData, []);
    expect(kecResult).toEqual([]);
  });
});

describe('Dashboard - No Target in TransactionItem', () => {
  it('TransactionItem should not have target field', () => {
    const tx = transactions[0];
    expect(tx).not.toHaveProperty('target');
    expect('target' in tx).toBe(false);
  });
});

describe('Dashboard - countByResponden', () => {
  it('should count respondents per PPL/SLS', () => {
    const result = countByResponden(transactions);
    expect(result).toHaveLength(4);

    const ppl1Sls1a = result.find(
      (r) => r.namaPpl === 'PPL_1' && r.sls === 'SLS_1A'
    );
    expect(ppl1Sls1a).toBeDefined();
    expect(ppl1Sls1a!.jumlah).toBe(2);
    expect(ppl1Sls1a!.kecamatan).toBe('KEC_1');
  });

  it('should filter by PJ Organik', () => {
    const result = countByResponden(transactions, 'PJ_A');
    expect(result).toHaveLength(3);
    expect(result.every((r) => r.pjOrganik === 'PJ_A')).toBe(true);
  });

  it('should return empty for non-existent PJ', () => {
    const result = countByResponden(transactions, 'PJ_X');
    expect(result).toHaveLength(0);
  });

  it('should sort by namaPpl then kecamatan', () => {
    const result = countByResponden(transactions);
    expect(result[0].namaPpl).toBe('PPL_1');
  });
});

describe('Dashboard - aggregateDailyReport', () => {
  it('should aggregate by date/PPL/SLS', () => {
    const result = aggregateDailyReport(transactions);
    expect(result.length).toBeGreaterThan(0);

    const aug1Ppl1 = result.filter(
      (r) => r.tanggal === '2026-08-01' && r.namaPpl === 'PPL_1'
    );
    expect(aug1Ppl1.length).toBeGreaterThan(0);
  });

  it('should filter by PJ Organik', () => {
    const result = aggregateDailyReport(transactions, 'PJ_B');
    expect(result.length).toBe(1);
    expect(result[0].namaPpl).toBe('PPL_3');
    expect(result[0].jumlah).toBe(1);
  });

  it('should sort by date descending', () => {
    const result = aggregateDailyReport(transactions);
    if (result.length >= 2) {
      expect(result[0].tanggal >= result[1].tanggal).toBe(true);
    }
  });

  it('should handle empty transactions', () => {
    const result = aggregateDailyReport([]);
    expect(result).toEqual([]);
  });
});
