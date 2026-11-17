import type { FacilityKey, RegionId } from './types.js';

export interface RegionMeta {
  id: RegionId;
  name: string;
  /** Gambaran umum wilayah (sama untuk semua skenario). */
  about: string;
  facility: FacilityKey;
}

export const REGIONS: RegionMeta[] = [
  { id: 'pasar', name: 'Pasar & Warung', about: 'Ramai setiap hari, banyak orang bertemu dan jajan.', facility: 'pasar' },
  { id: 'sekolah', name: 'Sekolah & Lapangan', about: 'Anak-anak berkumpul; guru dan UKS cepat memberi kabar.', facility: 'sekolah' },
  { id: 'permukiman', name: 'Permukiman Tepi Kali', about: 'Rumah rapat, banyak wadah air, jauh dari puskesmas.', facility: 'balai' },
  { id: 'puskesmas', name: 'Sekitar Puskesmas', about: 'Dekat layanan kesehatan dan posyandu; warga cepat diperiksa.', facility: 'puskesmas' },
];

export const REGION_BY_ID: Record<RegionId, RegionMeta> = Object.fromEntries(REGIONS.map((r) => [r.id, r])) as Record<RegionId, RegionMeta>;
export const REGION_IDS = REGIONS.map((r) => r.id);
