import type { SchoolFeature, SchoolGeoJSON } from "../utils/types";
import { fetchAllRecords } from "../utils/education-api";

interface IpsRecord {
  uai: string;
  nom_de_l_etablissement: string;
  nom_de_la_commune: string;
  departement: string;
  code_du_departement: string;
  academie: string;
  region_academique: string;
  secteur: string;
  ips: number;
  ecart_type_de_l_ips: number;
  rentree_scolaire: string;
}

interface IvacRecord {
  uai: string;
  nom_de_l_etablissement: string;
  session: string;
  taux_de_reussite_g: number | null;
  nb_candidats_g: number | null;
  nb_mentions_tb_g: number | null;
  nb_mentions_b_g: number | null;
  nb_mentions_ab_g: number | null;
  va_du_taux_de_reussite_g: number | null;
  note_a_l_ecrit_g: number | null;
  va_de_la_note_g: number | null;
  region_academique: string;
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
const EXPECTED_MIN_FEATURES = 6000; // ~6 350 collèges expected after geo join

export default defineEventHandler(async () => {
  const now = Date.now();
  if (cachedData && (now - cachedAt) < CACHE_TTL) {
    return cachedData;
  }

  // Fetch all 3 datasets in parallel
  console.warn("[colleges] Fetching datasets from data.education.gouv.fr...");
  const [ipsRecords, ivacRecords, annuaireRecords] = await Promise.all([
    fetchAllRecords<IpsRecord>("fr-en-ips-colleges-ap2023", {
      where: "rentree_scolaire=\"2024-2025\"",
      select: "uai,nom_de_l_etablissement,nom_de_la_commune,departement,code_du_departement,academie,region_academique,secteur,ips,ecart_type_de_l_ips,rentree_scolaire",
      orderBy: "uai",
    }),
    fetchAllRecords<IvacRecord>("fr-en-indicateurs-valeur-ajoutee-colleges", {
      where: "year(session)=2024",
      select: "uai,nom_de_l_etablissement,taux_de_reussite_g,nb_candidats_g,nb_mentions_tb_g,nb_mentions_b_g,nb_mentions_ab_g,va_du_taux_de_reussite_g,note_a_l_ecrit_g,va_de_la_note_g,region_academique",
      orderBy: "uai",
    }),
    fetchAllRecords<AnnuaireRecord>("fr-en-annuaire-education", {
      where: "type_etablissement=\"Collège\"",
      select: "identifiant_de_l_etablissement,latitude,longitude",
      orderBy: "identifiant_de_l_etablissement",
    }),
  ]);

  console.warn(`[colleges] Fetched: ${ipsRecords.length} IPS, ${ivacRecords.length} IVAC, ${annuaireRecords.length} Annuaire`);

  // Index IVAC and Annuaire by UAI for fast lookup
  const ivacByUai = new Map<string, IvacRecord>();
  for (const record of ivacRecords) {
    if (record.uai)
      ivacByUai.set(record.uai, record);
  }

  const geoByUai = new Map<string, AnnuaireRecord>();
  for (const record of annuaireRecords) {
    if (record.identifiant_de_l_etablissement) {
      geoByUai.set(record.identifiant_de_l_etablissement, record);
    }
  }

  // Join datasets: IPS as primary, enriched with IVAC results and Annuaire geo
  const features: SchoolFeature[] = [];

  for (const ips of ipsRecords) {
    if (!ips.uai || !ips.ips)
      continue;

    const geo = geoByUai.get(ips.uai);
    if (!geo || !geo.latitude || !geo.longitude)
      continue;

    const ivac = ivacByUai.get(ips.uai);

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [geo.longitude, geo.latitude],
      },
      properties: {
        uai: ips.uai,
        nom: ips.nom_de_l_etablissement || ivac?.nom_de_l_etablissement || "Inconnu",
        commune: ips.nom_de_la_commune || "",
        departement: ips.departement || "",
        code_departement: ips.code_du_departement || "",
        region: ips.region_academique || ivac?.region_academique || "",
        academie: ips.academie || "",
        secteur: ips.secteur || "",
        ips: Number(ips.ips) || 0,
        ecart_type_ips: Number(ips.ecart_type_de_l_ips) || 0,
        taux_reussite: ivac?.taux_de_reussite_g ?? null,
        mentions_tb: ivac?.nb_mentions_tb_g ?? null,
        mentions_b: ivac?.nb_mentions_b_g ?? null,
        mentions_ab: ivac?.nb_mentions_ab_g ?? null,
        nb_candidats: ivac?.nb_candidats_g ?? null,
        valeur_ajoutee: ivac?.va_du_taux_de_reussite_g ?? null,
        note_ecrit: ivac?.note_a_l_ecrit_g ?? null,
        va_note_ecrit: ivac?.va_de_la_note_g ?? null,
        taux_mentions: null,
        va_mentions: null,
        type_lycee: null,
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

  console.warn(`[colleges] Built GeoJSON with ${features.length} features (dropped ${ipsRecords.length - features.length} without geo/IPS)`);

  if (features.length < EXPECTED_MIN_FEATURES) {
    console.error(`[colleges] Only ${features.length} features (expected >= ${EXPECTED_MIN_FEATURES}). Data may be incomplete.`);
    throw createError({
      statusCode: 500,
      message: `Incomplete data: only ${features.length} collèges (expected >= ${EXPECTED_MIN_FEATURES})`,
    });
  }

  cachedData = geojson;
  cachedAt = now;

  return geojson;
});
