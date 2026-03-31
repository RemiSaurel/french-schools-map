import type { LyceeType, SchoolFeature, SchoolGeoJSON } from "../utils/types";
import { fetchAllRecords } from "../utils/education-api";

/** Map raw API type_de_lycee codes to our LyceeType values */
function parseLyceeType(raw: string | null | undefined): LyceeType | null {
  switch (raw) {
    case "LEGT": return "general";
    case "LP": return "professionnel";
    case "LPO": return "polyvalent";
    default: return null;
  }
}

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

interface BacProRecord {
  uai: string;
  libelle_uai: string;
  annee: string;
  taux_reu_total: number | null;
  presents_total: number | null;
  va_reu_total: number | null;
  taux_men_total: number | null;
  va_men_total: number | null;
  nb_mentions_tb_sansf_p: number | null;
  nb_mentions_b_p: number | null;
  nb_mentions_ab_p: number | null;
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
const EXPECTED_MIN_FEATURES = 3000; // ~3 600 lycées expected

export default defineEventHandler(async () => {
  const now = Date.now();
  if (cachedData && (now - cachedAt) < CACHE_TTL) {
    return cachedData;
  }

  // Fetch all 4 datasets in parallel
  console.warn("[lycees] Fetching datasets from data.education.gouv.fr...");
  const [ipsRecords, bacGtRecords, bacProRecords, annuaireRecords] = await Promise.all([
    fetchAllRecords<IpsLyceeRecord>("fr-en-ips-lycees-ap2023", {
      where: "rentree_scolaire=\"2024-2025\"",
      select: "uai,nom_de_l_etablissement,nom_de_la_commune,departement,code_du_departement,academie,region_academique,secteur,type_de_lycee,ips_etab,ecart_type_etablissement,rentree_scolaire",
    }),
    fetchAllRecords<BacResultRecord>("fr-en-indicateurs-de-resultat-des-lycees-gt_v2", {
      where: "year(annee)=2024",
      select: "uai,libelle_uai,taux_reu_total,presents_total,va_reu_total,taux_men_total,va_men_total,nb_mentions_tb_avecf_g,nb_mentions_tb_sansf_g,nb_mentions_b_g,nb_mentions_ab_g,nb_mentions_tb_avecf_t,nb_mentions_tb_sansf_t,nb_mentions_b_t,nb_mentions_ab_t,libelle_region",
    }),
    fetchAllRecords<BacProRecord>("fr-en-indicateurs-de-resultat-des-lycees-pro_v2", {
      where: "year(annee)=2024",
      select: "uai,libelle_uai,taux_reu_total,presents_total,va_reu_total,taux_men_total,va_men_total,nb_mentions_tb_sansf_p,nb_mentions_b_p,nb_mentions_ab_p,libelle_region",
    }),
    fetchAllRecords<AnnuaireRecord>("fr-en-annuaire-education", {
      where: "type_etablissement=\"Lycée\"",
      select: "identifiant_de_l_etablissement,latitude,longitude",
    }),
  ]);

  console.warn(`[lycees] Fetched: ${ipsRecords.length} IPS, ${bacGtRecords.length} Bac GT, ${bacProRecords.length} Bac Pro, ${annuaireRecords.length} Annuaire`);

  // Index Bac GT, Bac Pro, and Annuaire by UAI for fast lookup
  const bacByUai = new Map<string, BacResultRecord>();
  for (const record of bacGtRecords) {
    if (record.uai)
      bacByUai.set(record.uai, record);
  }

  const bacProByUai = new Map<string, BacProRecord>();
  for (const record of bacProRecords) {
    if (record.uai)
      bacProByUai.set(record.uai, record);
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

    // LP lycées use Bac Pro dataset; LEGT and LPO use the GT dataset (LPO fall back to Pro if GT missing)
    const isLp = ips.type_de_lycee === "LP";
    const bac = isLp ? null : bacByUai.get(ips.uai) ?? null;
    const bacPro = (isLp || !bac) ? bacProByUai.get(ips.uai) ?? null : null;

    // Determine active exam record and compute shared fields
    const examRecord = bac ?? bacPro;
    const taux_reussite = examRecord?.taux_reu_total ?? null;
    const nb_candidats = examRecord?.presents_total ?? null;
    const valeur_ajoutee = examRecord?.va_reu_total ?? null;
    const taux_mentions = examRecord?.taux_men_total ?? null;
    const va_mentions = examRecord?.va_men_total ?? null;

    // Calculate mentions counts — field names differ between GT (_g/_t) and Pro (_p) datasets
    let mentionsTb: number | null = null;
    let mentionsB: number | null = null;
    let mentionsAb: number | null = null;

    if (bac) {
      mentionsTb = ((bac.nb_mentions_tb_avecf_g ?? 0) + (bac.nb_mentions_tb_sansf_g ?? 0)
        + (bac.nb_mentions_tb_avecf_t ?? 0) + (bac.nb_mentions_tb_sansf_t ?? 0)) || null;
      mentionsB = ((bac.nb_mentions_b_g ?? 0) + (bac.nb_mentions_b_t ?? 0)) || null;
      mentionsAb = ((bac.nb_mentions_ab_g ?? 0) + (bac.nb_mentions_ab_t ?? 0)) || null;
    } else if (bacPro) {
      mentionsTb = bacPro.nb_mentions_tb_sansf_p || null;
      mentionsB = bacPro.nb_mentions_b_p || null;
      mentionsAb = bacPro.nb_mentions_ab_p || null;
    }

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [geo.longitude, geo.latitude],
      },
      properties: {
        uai: ips.uai,
        nom: ips.nom_de_l_etablissement || examRecord?.libelle_uai || "Inconnu",
        commune: ips.nom_de_la_commune || "",
        departement: ips.departement || "",
        code_departement: ips.code_du_departement || "",
        region: ips.region_academique || examRecord?.libelle_region || "",
        academie: ips.academie || "",
        secteur: ips.secteur || "",
        ips: Number(ips.ips_etab) || 0,
        ecart_type_ips: Number(ips.ecart_type_etablissement) || 0,
        taux_reussite,
        mentions_tb: mentionsTb,
        mentions_b: mentionsB,
        mentions_ab: mentionsAb,
        nb_candidats,
        valeur_ajoutee,
        note_ecrit: null, // No written exam score for Bac
        va_note_ecrit: null, // No VA note for Bac
        taux_mentions,
        va_mentions,
        type_lycee: parseLyceeType(ips.type_de_lycee),
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

  console.warn(`[lycees] Built GeoJSON with ${features.length} features (dropped ${ipsRecords.length - features.length} without geo/IPS)`);

  if (features.length < EXPECTED_MIN_FEATURES) {
    console.error(`[lycees] Only ${features.length} features (expected >= ${EXPECTED_MIN_FEATURES}). Data may be incomplete.`);
    throw createError({
      statusCode: 500,
      message: `Incomplete data: only ${features.length} lycées (expected >= ${EXPECTED_MIN_FEATURES})`,
    });
  }

  cachedData = geojson;
  cachedAt = now;

  return geojson;
});
