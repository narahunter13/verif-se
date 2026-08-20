import { describe, it, expect } from 'vitest';
import type { MasterItem, TransactionItem } from '../types';
import {
  getUniquePJOrganik,
  filterByPJOrganik,
  filterByPPL,
  filterByKecamatan,
  filterByKelurahan,
  getTarget,
  getTargetFromMaster,
  getUniqueTargetSum,
  generateFileName
} from '../logic';

const dummyMaster: MasterItem[] = [
  { pjOrganik: 'PJ_A', namaPpl: 'PPL_1', kecamatan: 'KEC_1', kelurahan: 'KEL_1', sls: 'SLS_1A', target: 10 },
  { pjOrganik: 'PJ_A', namaPpl: 'PPL_1', kecamatan: 'KEC_1', kelurahan: 'KEL_1', sls: 'SLS_1B', target: 15 },
  { pjOrganik: 'PJ_A', namaPpl: 'PPL_1', kecamatan: 'KEC_1', kelurahan: 'KEL_2', sls: 'SLS_2A', target: 20 },
  { pjOrganik: 'PJ_A', namaPpl: 'PPL_2', kecamatan: 'KEC_2', kelurahan: 'KEL_3', sls: 'SLS_3A', target: 12 },
  { pjOrganik: 'PJ_B', namaPpl: 'PPL_3', kecamatan: 'KEC_3', kelurahan: 'KEL_4', sls: 'SLS_4A', target: 8 },
  { pjOrganik: 'PJ_B', namaPpl: 'PPL_3', kecamatan: 'KEC_3', kelurahan: 'KEL_4', sls: 'SLS_4B', target: 5 },
  { pjOrganik: 'PJ_B', namaPpl: 'PPL_4', kecamatan: 'KEC_4', kelurahan: 'KEL_5', sls: 'SLS_5A', target: 18 },
];

const dummyTransactions: TransactionItem[] = [
  { timestamp: '2026-08-01 10:00:00', pjOrganik: 'PJ_A', namaPpl: 'PPL_1', kecamatan: 'KEC_1', kelurahan: 'KEL_1', sls: 'SLS_1A', namaResponden: 'R1', urlFoto: 'http://example.com/1.jpg' },
  { timestamp: '2026-08-01 11:00:00', pjOrganik: 'PJ_A', namaPpl: 'PPL_1', kecamatan: 'KEC_1', kelurahan: 'KEL_1', sls: 'SLS_1A', namaResponden: 'R2', urlFoto: 'http://example.com/2.jpg' },
  { timestamp: '2026-08-01 12:00:00', pjOrganik: 'PJ_A', namaPpl: 'PPL_1', kecamatan: 'KEC_1', kelurahan: 'KEL_1', sls: 'SLS_1B', namaResponden: 'R3', urlFoto: 'http://example.com/3.jpg' },
  { timestamp: '2026-08-01 13:00:00', pjOrganik: 'PJ_A', namaPpl: 'PPL_2', kecamatan: 'KEC_2', kelurahan: 'KEL_3', sls: 'SLS_3A', namaResponden: 'R4', urlFoto: 'http://example.com/4.jpg' },
  { timestamp: '2026-08-01 14:00:00', pjOrganik: 'PJ_B', namaPpl: 'PPL_3', kecamatan: 'KEC_3', kelurahan: 'KEL_4', sls: 'SLS_4A', namaResponden: 'R5', urlFoto: 'http://example.com/5.jpg' },
];

describe('Cascading Filter - getUniquePJOrganik', () => {
  it('should return unique sorted PJ Organik list', () => {
    const result = getUniquePJOrganik(dummyMaster);
    expect(result).toEqual(['PJ_A', 'PJ_B']);
  });

  it('should return empty array for empty master list', () => {
    expect(getUniquePJOrganik([])).toEqual([]);
  });
});

describe('Cascading Filter - filterByPJOrganik', () => {
  it('should return PPL under PJ_A', () => {
    const result = filterByPJOrganik(dummyMaster, 'PJ_A');
    expect(result).toEqual(['PPL_1', 'PPL_2']);
  });

  it('should return PPL under PJ_B', () => {
    const result = filterByPJOrganik(dummyMaster, 'PJ_B');
    expect(result).toEqual(['PPL_3', 'PPL_4']);
  });

  it('should return empty for non-existent PJ', () => {
    expect(filterByPJOrganik(dummyMaster, 'PJ_X')).toEqual([]);
  });
});

describe('Cascading Filter - filterByPPL', () => {
  it('should return kecamatan for PPL_1 under PJ_A', () => {
    const result = filterByPPL(dummyMaster, 'PJ_A', 'PPL_1');
    expect(result).toEqual(['KEC_1']);
  });

  it('should return kecamatan for PPL_3 under PJ_B', () => {
    const result = filterByPPL(dummyMaster, 'PJ_B', 'PPL_3');
    expect(result).toEqual(['KEC_3']);
  });
});

describe('Cascading Filter - filterByKecamatan', () => {
  it('should return kelurahan in KEC_1', () => {
    const result = filterByKecamatan(dummyMaster, 'PJ_A', 'PPL_1', 'KEC_1');
    expect(result).toEqual(['KEL_1', 'KEL_2']);
  });

  it('should return kelurahan in KEC_3', () => {
    const result = filterByKecamatan(dummyMaster, 'PJ_B', 'PPL_3', 'KEC_3');
    expect(result).toEqual(['KEL_4']);
  });
});

describe('Cascading Filter - filterByKelurahan', () => {
  it('should return SLS in KEL_1', () => {
    const result = filterByKelurahan(dummyMaster, 'PJ_A', 'PPL_1', 'KEC_1', 'KEL_1');
    expect(result).toEqual(['SLS_1A', 'SLS_1B']);
  });

  it('should return SLS in KEL_4', () => {
    const result = filterByKelurahan(dummyMaster, 'PJ_B', 'PPL_3', 'KEC_3', 'KEL_4');
    expect(result).toEqual(['SLS_4A', 'SLS_4B']);
  });
});

describe('getTarget', () => {
  it('should return correct target for SLS_1A', () => {
    const result = getTarget(dummyMaster, 'PJ_A', 'PPL_1', 'KEC_1', 'KEL_1', 'SLS_1A');
    expect(result).toBe(10);
  });

  it('should return correct target for SLS_5A', () => {
    const result = getTarget(dummyMaster, 'PJ_B', 'PPL_4', 'KEC_4', 'KEL_5', 'SLS_5A');
    expect(result).toBe(18);
  });

  it('should return 0 for non-existent SLS', () => {
    expect(getTarget(dummyMaster, 'PJ_X', 'PPL_X', 'KEC_X', 'KEL_X', 'SLS_X')).toBe(0);
  });
});

describe('getTargetFromMaster', () => {
  it('should return target from master list', () => {
    const result = getTargetFromMaster(dummyMaster, 'PJ_A', 'PPL_1', 'KEC_1', 'KEL_1', 'SLS_1A');
    expect(result).toBe(10);
  });
});

describe('getUniqueTargetSum', () => {
  it('should sum unique targets from transactions', () => {
    const result = getUniqueTargetSum(dummyMaster, dummyTransactions);
    // SLS_1A appears twice, counted once (10)
    // SLS_1B once (15), SLS_3A once (12), SLS_4A once (8)
    expect(result).toBe(10 + 15 + 12 + 8);
  });

  it('should return 0 for empty transactions', () => {
    expect(getUniqueTargetSum(dummyMaster, [])).toBe(0);
  });
});

describe('generateFileName', () => {
  it('should generate filename with underscore format', () => {
    const result = generateFileName('PJ_A', 'PPL_1', 'KEC_1', 'KEL_1', 'SLS_1A', 'R1');
    expect(result).toBe('PJ_A_PPL_1_KEC_1_KEL_1_SLS_1A_R1.jpg');
  });

  it('should default to jpg extension', () => {
    const result = generateFileName('PJ', 'PPL', 'KEC', 'KEL', 'SLS', 'R');
    expect(result).toMatch(/\.jpg$/);
  });

  it('should accept custom extension', () => {
    const result = generateFileName('PJ', 'PPL', 'KEC', 'KEL', 'SLS', 'R', 'png');
    expect(result).toMatch(/\.png$/);
  });

  it('should sanitize special characters', () => {
    const result = generateFileName('PJ/A', 'PPL:B', 'KEC\\C', 'KEL*D', 'SLS?E', 'R"F');
    expect(result).toBe('PJ_A_PPL_B_KEC_C_KEL_D_SLS_E_R_F.jpg');
  });

  it('should collapse multiple underscores', () => {
    const result = generateFileName('PJ  A', 'PPL   B', 'KEC', 'KEL', 'SLS', 'R');
    expect(result).toBe('PJ_A_PPL_B_KEC_KEL_SLS_R.jpg');
  });

  it('should trim leading/trailing underscores', () => {
    const result = generateFileName('_PJ_', '_PPL_', 'KEC', 'KEL', 'SLS', 'R');
    expect(result).toBe('PJ_PPL_KEC_KEL_SLS_R.jpg');
  });

  it('should handle spaces in names', () => {
    const result = generateFileName('PJ Organik', 'Nama PPL', 'Kec A', 'Kel B', 'SLS C', 'R D');
    expect(result).toBe('PJ_Organik_Nama_PPL_Kec_A_Kel_B_SLS_C_R_D.jpg');
  });
});
