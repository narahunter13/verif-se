# Planning Dokumen: Aplikasi Verifikasi Lapangan (Svelte 5 + Rust WASM + GAS + Google Sheets)

## 1. Ikhtisar Proyek
Aplikasi Single Page Application (SPA) berbasis web menggunakan Svelte 5 (Runes mode, TypeScript), Vite, dan Tailwind CSS v4. Aplikasi ini bertindak sebagai alat pengumpulan foto verifikasi lapangan dengan fitur kompresi gambar client-side menggunakan Rust WASM, integrasi backend Google Apps Script (GAS), serta Google Sheets & Google Drive sebagai basis data dan penyimpanan file.

---

## 2. Arsitektur & Teknologi Stack
- **Frontend Stack:**
  - Framework: Svelte 5 (Runes Mode: `$state`, `$derived`, `$effect`, TypeScript)
  - Build Tool: Vite + `pnpm`
  - Styling: Tailwind CSS v4
  - WASM Bridge: `wasm-pack` / Rust output `wasm32-unknown-unknown`
- **Backend Stack:**
  - Service: Google Apps Script (GAS) Web App
  - Database: Google Sheets (Tab `Master_Target` & Tab `Transaksi_Verifikasi`)
  - Storage: Google Drive Folder (Penyimpanan Foto Hasil Verifikasi)
- **Kompresi Gambar:**
  - Rust WASM (`image` atau `photon_rs` crate) memproses resize & kompresi di browser thread / Web Worker sebelum dikirim via HTTP POST.

---

## 3. Skema Data Google Sheets

### A. Sheet `Master_Target`
Digunakan untuk cascading filter & kalkulasi target pada dashboard.
| Kolom | Nama Header | Tipe Data | Keterangan |
| :--- | :--- | :--- | :--- |
| A | `PJ Organik` | String | Nama Penanggung Jawab |
| B | `Nama PPL` | String | Nama Petugas Pendataan |
| C | `Kecamatan` | String | Kode / Nama Kecamatan |
| D | `Kelurahan` | String | Kode / Nama Kelurahan/Desa |
| E | `SLS` | String | Kode / Nama SLS |
| F | `Target` | Integer | Jumlah target responden di SLS tersebut |

### B. Sheet `Transaksi_Verifikasi`
Digunakan untuk menyimpan hasil entri form.
| Kolom | Nama Header | Tipe Data | Keterangan |
| :--- | :--- | :--- | :--- |
| A | `Timestamp` | DateTime | Waktu upload dari GAS (`YYYY-MM-DD HH:mm:ss`) |
| B | `PJ Organik` | String | Dari form |
| C | `Nama PPL` | String | Dari form |
| D | `Kecamatan` | String | Dari form |
| E | `Kelurahan` | String | Dari form |
| F | `SLS` | String | Dari form |
| G | `Nama Responden` | String | Nama responden sesuai lembar kerja |
| H | `URL Foto` | String | Link preview file di Google Drive |

---

## 4. Alur Progressive Cascading Filter (Client-Side)

Agar input data presisi, pilihan dropdown bertahap memfilter opsi berikutnya secara otomatis:
1. **Pilih `PJ Organik`** $\rightarrow$ Filter daftar `Nama PPL` unik yang berada di bawah PJ tersebut.
2. **Pilih `Nama PPL`** $\rightarrow$ Filter daftar `Kecamatan` unik yang ditugaskan ke PPL tersebut.
3. **Pilih `Kecamatan`** $\rightarrow$ Filter daftar `Kelurahan` unik di Kecamatan tersebut.
4. **Pilih `Kelurahan`** $\rightarrow$ Filter daftar `SLS` unik di Kelurahan tersebut.
5. **Pilih `SLS`** $\rightarrow$ Set nilai `Target` otomatis & mengaktifkan dropdown `Nama Responden` (opsional jika responden belum terdaftar di master data, diisi manual atau pilihan dari sub-master).

---

## 5. Kompresi Gambar (Rust WASM)

### Alur Kerja:
1. User memilih file gambar (PNG / JPG / JPEG) via `<input type="file" accept="image/*">`.
2. File diubah menjadi `Uint8Array` dan diteruskan ke fungsi WASM Rust `compress_image(data, quality, max_width)`.
3. Rust memproses dekode format, resize jika lebar melampaui `max_width` (misal 1280px), dan mereduksi kualitas JPEG ke target ~80%.
4. Hasil kompresi dikembalikan sebagai `Uint8Array` / `Base64` ke JavaScript Svelte 5.
5. Ukuran payload berkurang drastis (misal 5MB menjadi < 400KB), mengurangi waktu upload & risiko timeout GAS.

---

## 6. Backend Google Apps Script (GAS)

### Struktur Function GAS (`Code.gs`):
```javascript
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID";
const DRIVE_FOLDER_ID = "YOUR_DRIVE_FOLDER_ID";

function doGet(e) {
  const action = e.parameter.action;
  if (action === "getInitialData") {
    return ContentService.createTextOutput(JSON.stringify(getInitialData()))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // 1. Save Image to Drive
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const contentType = data.fileType || "image/jpeg";
    const blob = Utilities.newBlob(Utilities.base64Decode(data.fileBase64), contentType, `${data.sls}_${data.namaResponden}_${Date.now()}.jpg`);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const fileUrl = file.getUrl();
    
    // 2. Append Row to Transaksi_Verifikasi
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Transaksi_Verifikasi");
    const timestamp = new Date();
    sheet.appendRow([
      timestamp,
      data.pjOrganik,
      data.namaPpl,
      data.kecamatan,
      data.kelurahan,
      data.sls,
      data.target,
      data.namaResponden,
      fileUrl
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: "success", fileUrl }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getInitialData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const masterSheet = ss.getSheetByName("Master_Target");
  const masterData = masterSheet.getDataRange().getValues();
  masterData.shift(); // Remove header
  
  const transSheet = ss.getSheetByName("Transaksi_Verifikasi");
  const transData = transSheet ? transSheet.getDataRange().getValues() : [];
  if (transData.length > 0) transData.shift();

  return { master: masterData, transactions: transData };
}
```

---

## 7. Rancangan Frontend Svelte 5 (Runes Mode)

### A. Structure Directory (`src/`)
```
src/
├── lib/
│   ├── components/
│   │   ├── FormVerifikasi.svelte
│   │   ├── Dashboard.svelte
│   │   ├── ChartProgress.svelte
│   │   └── TableBreakdown.svelte
│   ├── wasm/
│   │   └── image_compressor.wasm
│   ├── state/
│   │   └── appState.svelte.ts
│   └── utils/
│       └── wasmLoader.ts
├── App.svelte
├── app.css (Tailwind v4)
└── main.ts
```

### B. State Management dengan Svelte 5 Runes (`appState.svelte.ts`)
```typescript
export interface MasterItem {
  pjOrganik: string;
  namaPpl: string;
  kecamatan: string;
  kelurahan: string;
  sls: string;
  target: number;
}

export interface TransactionItem {
  timestamp: string;
  pjOrganik: string;
  namaPpl: string;
  kecamatan: string;
  kelurahan: string;
  sls: string;
  target: number;
  namaResponden: string;
  urlFoto: string;
}

const createStore = () => {
  let masterList = $state<MasterItem[]>([]);
  let transactionList = $state<TransactionItem[]>([]);
  let isLoading = $state<boolean>(false);

  const fetchData = async () => {
    isLoading = true;
    try {
      const res = await fetch("YOUR_GAS_WEB_APP_URL?action=getInitialData");
      const data = await res.json();
      masterList = data.master.map((row: any) => ({
        pjOrganik: row[0],
        namaPpl: row[1],
        kecamatan: row[2],
        kelurahan: row[3],
        sls: row[4],
        target: Number(row[5]) || 0
      }));
      transactionList = data.transactions.map((row: any) => ({
        timestamp: row[0],
        pjOrganik: row[1],
        namaPpl: row[2],
        kecamatan: row[3],
        kelurahan: row[4],
        sls: row[5],
        target: Number(row[6]) || 0,
        namaResponden: row[7],
        urlFoto: row[8]
      }));
    } finally {
      isLoading = false;
    }
  };

  return {
    get masterList() { return masterList; },
    get transactionList() { return transactionList; },
    get isLoading() { return isLoading; },
    fetchData
  };
};

export const store = createStore();
```

---

## 8. Dashboard Monitoring & Analytics

Dashboard menyediakan breakdown real-time berdasarkan data transaksi ter-upload:
1. **Chart Progress per PPL:**
   - Bar Chart horizontal/vertikal membandingkan `Total Upload` vs `Total Target` per PPL.
2. **Breakdown Table per Kecamatan:**
   - Agregasi `Target` vs `Realisasi (Jumlah Foto Upload)` + `% Progress`.
3. **Breakdown Table per Kelurahan:**
   - Drilldown berdasarkan kecamatan yang dipilih pada filter dashboard.
4. **Breakdown Table per SLS:**
   - Rincian paling detail untuk memantau SLS mana saja yang belum/sudah selesai dikerjakan.

---

## 9. Rencana Eksekusi Proyek
1. **Inisialisasi Project:** setup Vite Svelte 5 TypeScript, Tailwind v4, pnpm.
2. **Setup WASM Engine:** Buat modul kompresi Rust dengan `wasm-pack`.
3. **Setup Google Apps Script & Sheet:** Buat Sheet master & script deployment.
4. **Pengembangan Form Component:** Implementasi cascading dropdown filter & image uploader.
5. **Pengembangan Dashboard Component:** Visualisasi chart & tabel drilldown per tingkat wilayah.
6. **Testing & Integration Test:** Uji kompresi WASM client side & ketahanan upload data ke GAS.
