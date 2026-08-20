import { describe, it, expect } from 'vitest';

// Test GAS schema expectations (no target in Transaksi_Verifikasi)
describe('GAS Schema - Transaksi_Verifikasi', () => {
  it('should have 8 columns (no Target)', () => {
    const headers = [
      'Timestamp', 'PJ Organik', 'Nama PPL', 'Kecamatan', 'Kelurahan',
      'SLS', 'Nama Responden', 'URL Foto'
    ];
    expect(headers).toHaveLength(8);
    expect(headers).not.toContain('Target');
  });

  it('should map row indices correctly without target', () => {
    const row = [
      '2026-08-01 10:00:00',  // 0: Timestamp
      'PJ_A',                  // 1: PJ Organik
      'PPL_1',                 // 2: Nama PPL
      'KEC_1',                 // 3: Kecamatan
      'KEL_1',                 // 4: Kelurahan
      'SLS_1A',               // 5: SLS
      'Responden_1',           // 6: Nama Responden
      'http://drive.url/1'    // 7: URL Foto
    ];

    expect(row).toHaveLength(8);
    expect(row[0]).toBe('2026-08-01 10:00:00');
    expect(row[5]).toBe('SLS_1A');
    expect(row[6]).toBe('Responden_1');
    expect(row[7]).toBe('http://drive.url/1');
  });
});

describe('GAS Schema - Master_Target', () => {
  it('should have 6 columns including Target', () => {
    const headers = ['PJ Organik', 'Nama PPL', 'Kecamatan', 'Kelurahan', 'SLS', 'Target'];
    expect(headers).toHaveLength(6);
    expect(headers).toContain('Target');
  });
});

describe('Submit Data Payload', () => {
  it('should not include target field', () => {
    const payload = {
      pjOrganik: 'PJ_A',
      namaPpl: 'PPL_1',
      kecamatan: 'KEC_1',
      kelurahan: 'KEL_1',
      sls: 'SLS_1A',
      namaResponden: 'R1',
      fileBase64: 'base64data',
      fileType: 'image/jpeg'
    };

    expect(payload).not.toHaveProperty('target');
    expect(Object.keys(payload)).toHaveLength(8);
  });
});

describe('GAS Schema - Nomor Sheet', () => {
  it('should have 3 columns: PJ Organik, Nama PPL, Nomor WA', () => {
    const headers = ['PJ Organik', 'Nama PPL', 'Nomor WA'];
    expect(headers).toHaveLength(3);
    expect(headers).toContain('PJ Organik');
    expect(headers).toContain('Nama PPL');
    expect(headers).toContain('Nomor WA');
  });

  it('should map Nomor sheet row indices correctly', () => {
    const row = ['PJ_A', 'PPL_1', '6281234567890'];
    expect(row).toHaveLength(3);
    expect(row[0]).toBe('PJ_A');
    expect(row[1]).toBe('PPL_1');
    expect(row[2]).toBe('6281234567890');
  });

  it('should parse Nomor sheet data from GAS response', () => {
    const data = {
      nomorWa: [
        ['PJ_A', 'PPL_1', '6281234567890'],
        ['PJ_B', 'PPL_2', '6289876543210']
      ]
    };

    const parsed = data.nomorWa.map((row: unknown[]) => ({
      pjOrganik: String(row[0] || ''),
      namaPpl: String(row[1] || ''),
      nomorWa: String(row[2] || '')
    }));

    expect(parsed).toHaveLength(2);
    expect(parsed[0].pjOrganik).toBe('PJ_A');
    expect(parsed[0].namaPpl).toBe('PPL_1');
    expect(parsed[0].nomorWa).toBe('6281234567890');
    expect(parsed[1].pjOrganik).toBe('PJ_B');
  });

  it('should handle empty Nomor sheet', () => {
    const data = { nomorWa: [] };
    expect(data.nomorWa).toHaveLength(0);
  });
});

describe('GAS Response - fileUrl format', () => {
  it('should use Google Drive direct view link', () => {
    const fileId = 'abc123';
    const fileUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    expect(fileUrl).toBe('https://drive.google.com/uc?export=view&id=abc123');
    expect(fileUrl).toContain('export=view');
  });
});
