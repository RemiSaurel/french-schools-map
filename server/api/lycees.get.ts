import type { SchoolFeature, SchoolGeoJSON } from "../utils/types";
import { fetchAllRecords } from "../utils/education-api";

interface IpsLyceeRecord {
  uai: string;
  nom_de_l_etablissement: string;
  nom_de_la_commune: string;
  departement: string;
  code_du_departement: string;
  academie: string;
  region_academique: string;
  secteur: string;
  type_de_lycee: string;
  ips_etab: string | number | null;
  ecart_type_etablissement: string | number | null;
  rentree_scolaire: string;
}

interface BacResultRecord {
  uai: string;
  libelle_uai: string;
  annee: string;
  taux_reu_total: number | null;
  presents_total: number | null;
  va_reu_total: number | null;
  taux_men_total: number | null;
  va_men_total: number | null;
  nb_mentions_tb_avecf_g: number | null;
  nb_mentions_tb_sansf_g: number | null;
  nb_mentions_b_g: number | null;
  nb_mentions_ab_g: number | null;
  nb_mentions_tb_avecf_t: number | null;
  nb_mentions_tb_sansf_t: number | null;
  nb_mentions_b_t: number | null;
  nb_mentions_ab_t: number | null;
  libelle_region: string;
}

interface AnnuaireRecord {
  identifiant_de_l_etablissement: string;
  latitude: number;
  longitude: number;
}

// in-memory cache for the GeoJSON
let cachedData: SchoolGeoJSON | null = null;
let cachedAt = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export default defineEventHandler(async () => {
  const now = Date.now();
  if (cachedData && (now - cachedAt) < CACHE_TTL) {
    return cachedData;
  }

  // Fetch all 3 datasets in parallel
  const [ipsRecords, bacGtRecords, annuaireRecords] = await Promise.all([
    fetchAllRecords<IpsLyceeRecord>("fr-en-ips-lycees-ap2023", {
      where: "rentree_scolaire=\"2024-2025\"",
      select: "uai,nom_de_l_etablissement,nom_de_la_commune,departement,code_du_departement,academie,region_academique,secteur,type_de_lycee,ips_etab,ecart_type_etablissement,rentree_scolaire",
    }),
    fetchAllRecords<BacResultRecord>("fr-en-indicateurs-de-resultat-des-lycees-gt_v2", {
      where: "year(annee)=2024",
      select: "uai,libelle_uai,taux_reu_total,presents_total,va_reu_total,taux_men_total,va_men_total,nb_mentions_tb_avecf_g,nb_mentions_tb_sansf_g,nb_mentions_b_g,nb_mentions_ab_g,nb_mentions_tb_avecf_t,nb_mentions_tb_sansf_t,nb_mentions_b_t,nb_mentions_ab_t,libelle_region",
    }),
    fetchAllRecords<AnnuaireRecord>("fr-en-annuaire-education", {
      where: "type_etablissement=\"Lycée\"",
      select: "identifiant_de_l_etablissement,latitude,longitude",
    }),
  ]);

  // Index Bac results and Annuaire by UAI for fast lookup
  const bacByUai = new Map<string, BacResultRecord>();
  for (const record of bacGtRecords) {
    if (record.uai)
      bacByUai.set(record.uai, record);
  }

  const geoByUai = new Map<string, AnnuaireRecord>();
  for (const record of annuaireRecords) {
    if (record.identifiant_de_l_etablissement) {
      geoByUai.set(record.identifiant_de_l_etablissement, record);
    }
  }

  // Join datasets: IPS as primary, enriched with Bac results and Annuaire geo
  const features: SchoolFeature[] = [];

  for (const ips of ipsRecords) {
    if (!ips.uai || !ips.ips_etab)
      continue;

    const geo = geoByUai.get(ips.uai);
    if (!geo || !geo.latitude || !geo.longitude)
      continue;

    const bac = bacByUai.get(ips.uai);

    // Calculate mentions counts from both general (g) and techno (t) series
    const mentionsTb = bac
      ? ((bac.nb_mentions_tb_avecf_g ?? 0) + (bac.nb_mentions_tb_sansf_g ?? 0)
        + (bac.nb_mentions_tb_avecf_t ?? 0) + (bac.nb_mentions_tb_sansf_t ?? 0)) || null
      : null;
    const mentionsB = bac
      ? ((bac.nb_mentions_b_g ?? 0) + (bac.nb_mentions_b_t ?? 0)) || null
      : null;
    const mentionsAb = bac
      ? ((bac.nb_mentions_ab_g ?? 0) + (bac.nb_mentions_ab_t ?? 0)) || null
      : null;

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [geo.longitude, geo.latitude],
      },
      properties: {
        uai: ips.uai,
        nom: ips.nom_de_l_etablissement || bac?.libelle_uai || "Inconnu",
        commune: ips.nom_de_la_commune || "",
        departement: ips.departement || "",
        code_departement: ips.code_du_departement || "",
        region: ips.region_academique || bac?.libelle_region || "",
        academie: ips.academie || "",
        secteur: ips.secteur || "",
        ips: Number(ips.ips_etab) || 0,
        ecart_type_ips: Number(ips.ecart_type_etablissement) || 0,
        taux_reussite: bac?.taux_reu_total ?? null,
        mentions_tb: mentionsTb,
        mentions_b: mentionsB,
        mentions_ab: mentionsAb,
        nb_candidats: bac?.presents_total ?? null,
        valeur_ajoutee: bac?.va_reu_total ?? null,
        note_ecrit: null, // No written exam score for Bac
        taux_mentions: bac?.taux_men_total ?? null,
        va_mentions: bac?.va_men_total ?? null,
      },
    });
  }

  const geojson: SchoolGeoJSON = {
    type: "FeatureCollection",
    features,
    metadata: {
      total: features.length,
      ips_year: "2024-2025",
      exam_session: "2024",
      generated_at: new Date().toISOString(),
    },
  };

  cachedData = geojson;
  cachedAt = now;

  return geojson;
});
