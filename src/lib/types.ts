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
  namaResponden: string;
  urlFoto: string;
}

export interface FormData {
  pjOrganik: string;
  namaPpl: string;
  kecamatan: string;
  kelurahan: string;
  sls: string;
  namaResponden: string;
  file: File | null;
  filePreview: string | null;
}

export interface DashboardStats {
  totalTarget: number;
  totalRealisasi: number;
  persentase: number;
}

export interface KecamatanStats {
  nama: string;
  target: number;
  realisasi: number;
  persentase: number;
}

export interface KelurahanStats {
  nama: string;
  kecamatan: string;
  target: number;
  realisasi: number;
  persentase: number;
}

export interface SLSStats {
  nama: string;
  kelurahan: string;
  target: number;
  realisasi: number;
  persentase: number;
}

export interface NomorWaItem {
  pjOrganik: string;
  namaPpl: string;
  nomorWa: string;
}

export interface RespondenCountItem {
  pjOrganik: string;
  namaPpl: string;
  kecamatan: string;
  kelurahan: string;
  sls: string;
  jumlah: number;
}

export interface DailyReportItem {
  tanggal: string;
  namaPpl: string;
  sls: string;
  jumlah: number;
}
