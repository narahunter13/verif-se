# Hasil Testing - Aplikasi Verifikasi Lapangan

**Tanggal:** 20 Agustus 2026  
**Framework:** Vitest 4.1.11 + jsdom  
**Total Test:** 33 tests  
**Status:** ✅ ALL PASSED

---

## 1. Cascading Filter Tests (17 tests)

### 1.1 getUniquePJOrganik
| Test | Input | Expected | Status |
|------|-------|----------|--------|
| Return unique sorted PJ Organik | 7 master items (2 PJ) | `['PJ_A', 'PJ_B']` | ✅ |
| Return empty for empty master | 0 items | `[]` | ✅ |

### 1.2 filterByPJOrganik
| Test | Input | Expected | Status |
|------|-------|----------|--------|
| Return PPL under PJ_A | PJ_A, 4 items | `['PPL_1', 'PPL_2']` | ✅ |
| Return PPL under PJ_B | PJ_B, 3 items | `['PPL_3', 'PPL_4']` | ✅ |
| Return empty for non-existent PJ | PJ_X | `[]` | ✅ |

### 1.3 filterByPPL
| Test | Input | Expected | Status |
|------|-------|----------|--------|
| Return kecamatan for PPL_1 | PJ_A, PPL_1 | `['KEC_1']` | ✅ |
| Return kecamatan for PPL_3 | PJ_B, PPL_3 | `['KEC_3']` | ✅ |

### 1.4 filterByKecamatan
| Test | Input | Expected | Status |
|------|-------|----------|--------|
| Return kelurahan in KEC_1 | PJ_A, PPL_1, KEC_1 | `['KEL_1', 'KEL_2']` | ✅ |
| Return kelurahan in KEC_3 | PJ_B, PPL_3, KEC_3 | `['KEL_4']` | ✅ |

### 1.5 filterByKelurahan
| Test | Input | Expected | Status |
|------|-------|----------|--------|
| Return SLS in KEL_1 | PJ_A, PPL_1, KEC_1, KEL_1 | `['SLS_1A', 'SLS_1B']` | ✅ |
| Return SLS in KEL_4 | PJ_B, PPL_3, KEC_3, KEL_4 | `['SLS_4A', 'SLS_4B']` | ✅ |

### 1.6 getTarget
| Test | Input | Expected | Status |
|------|-------|----------|--------|
| Return correct target for SLS_1A | PJ_A, PPL_1, KEC_1, KEL_1, SLS_1A | `10` | ✅ |
| Return correct target for SLS_5A | PJ_B, PPL_4, KEC_4, KEL_5, SLS_5A | `18` | ✅ |
| Return 0 for non-existent SLS | PJ_X, PPL_X, KEC_X, KEL_X, SLS_X | `0` | ✅ |

### 1.7 getTargetFromMaster
| Test | Input | Expected | Status |
|------|-------|----------|--------|
| Return target from master list | Valid 5-field combo | `10` | ✅ |

### 1.8 getUniqueTargetSum
| Test | Input | Expected | Status |
|------|-------|----------|--------|
| Sum unique targets from transactions | 5 transactions (1 duplicate SLS) | `45` (10+15+12+8) | ✅ |
| Return 0 for empty transactions | Empty array | `0` | ✅ |

---

## 2. Dashboard Aggregation Tests (9 tests)

### 2.1 aggregateByPPL
| Test | Input | Expected | Status |
|------|-------|----------|--------|
| Aggregate realisasi per PPL | 5 transactions | PPL_1: realisasi=3, target=25 | ✅ |
| Sort by persentase descending | 3 PPL groups | First >= Second >= Third | ✅ |

### 2.2 aggregateByKecamatan
| Test | Input | Expected | Status |
|------|-------|----------|--------|
| Aggregate realisasi per kecamatan | 5 transactions | KEC_1: realisasi=3, target=25 | ✅ |

### 2.3 aggregateByKelurahan
| Test | Input | Expected | Status |
|------|-------|----------|--------|
| Aggregate kelurahan within filter | KEC_1 filter | KEL_1: realisasi=3, target=25 | ✅ |
| Return empty when no filter | Empty string | `[]` | ✅ |

### 2.4 aggregateBySLS
| Test | Input | Expected | Status |
|------|-------|----------|--------|
| Aggregate SLS within filter | KEL_1 filter | SLS_1A: realisasi=2, target=10, SLS_1B: realisasi=1, target=15 | ✅ |
| Return empty when no filter | Empty string | `[]` | ✅ |

### 2.5 Empty Data
| Test | Input | Expected | Status |
|------|-------|----------|--------|
| Handle empty transactions | Empty array | `[]` | ✅ |

### 2.6 No Target in TransactionItem
| Test | Input | Expected | Status |
|------|-------|----------|--------|
| TransactionItem should not have target field | Transaction object | `target` not in object | ✅ |

---

## 3. WASM Loader Tests (4 tests)

### 3.1 formatFileSize
| Test | Input | Expected | Status |
|------|-------|----------|--------|
| Format bytes | 0, 500, 1023 | `0 B`, `500 B`, `1023 B` | ✅ |
| Format kilobytes | 1024, 1536, 10240 | `1.0 KB`, `1.5 KB`, `10.0 KB` | ✅ |
| Format megabytes | 1048576, 5242880, 10485760 | `1.0 MB`, `5.0 MB`, `10.0 MB` | ✅ |

---

## 4. GAS Schema Tests (3 tests)

### 4.1 Transaksi_Verifikasi
| Test | Input | Expected | Status |
|------|-------|----------|--------|
| Should have 8 columns (no Target) | Header array | Length=8, no 'Target' | ✅ |
| Map row indices correctly | 8-element row | Correct index mapping | ✅ |

### 4.2 Master_Target
| Test | Input | Expected | Status |
|------|-------|----------|--------|
| Should have 6 columns including Target | Header array | Length=6, has 'Target' | ✅ |

### 4.3 Submit Data Payload
| Test | Input | Expected | Status |
|------|-------|----------|--------|
| Should not include target field | Payload object | No 'target' property | ✅ |

---

## Dummy Data Used

### Master_Target (7 items)
| PJ Organik | Nama PPL | Kecamatan | Kelurahan | SLS | Target |
|------------|----------|-----------|-----------|-----|--------|
| PJ_A | PPL_1 | KEC_1 | KEL_1 | SLS_1A | 10 |
| PJ_A | PPL_1 | KEC_1 | KEL_1 | SLS_1B | 15 |
| PJ_A | PPL_1 | KEC_1 | KEL_2 | SLS_2A | 20 |
| PJ_A | PPL_2 | KEC_2 | KEL_3 | SLS_3A | 12 |
| PJ_B | PPL_3 | KEC_3 | KEL_4 | SLS_4A | 8 |
| PJ_B | PPL_3 | KEC_3 | KEL_4 | SLS_4B | 5 |
| PJ_B | PPL_4 | KEC_4 | KEL_5 | SLS_5A | 18 |

### Transaksi_Verifikasi (5 items)
| Timestamp | PJ | PPL | Kecamatan | Kelurahan | SLS | Responden |
|-----------|----|-----|-----------|-----------|-----|-----------|
| 2026-08-01 10:00:00 | PJ_A | PPL_1 | KEC_1 | KEL_1 | SLS_1A | R1 |
| 2026-08-01 11:00:00 | PJ_A | PPL_1 | KEC_1 | KEL_1 | SLS_1A | R2 |
| 2026-08-01 12:00:00 | PJ_A | PPL_1 | KEC_1 | KEL_1 | SLS_1B | R3 |
| 2026-08-01 13:00:00 | PJ_A | PPL_2 | KEC_2 | KEL_3 | SLS_3A | R4 |
| 2026-08-01 14:00:00 | PJ_B | PPL_3 | KEC_3 | KEL_4 | SLS_4A | R5 |

---

## Run Command

```bash
pnpm test
```

## Files Tested

- `src/lib/logic.ts` - Pure functions (cascading filter, aggregation)
- `src/lib/wasm/wasmLoader.ts` - File size formatting
- `src/lib/__tests__/logic.test.ts` - 17 tests
- `src/lib/__tests__/dashboard.test.ts` - 9 tests
- `src/lib/__tests__/wasm.test.ts` - 3 tests
- `src/lib/__tests__/gas-schema.test.ts` - 4 tests
