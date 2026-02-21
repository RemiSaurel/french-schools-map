/**
 * Dataset configuration for the school map application.
 * Each dataset variant (colleges, lycees) defines its own
 * API endpoint, labels, exam names, and metadata.
 */

export type DatasetId = "colleges" | "lycees";

export interface DatasetConfig {
  /** Unique dataset identifier */
  id: DatasetId;
  /** French singular label (e.g. "collège", "lycée") */
  labelSingular: string;
  /** French plural label (e.g. "collèges", "lycées") */
  labelPlural: string;
  /** Title-cased plural label (e.g. "Collèges", "Lycées") */
  labelPluralTitle: string;
  /** API endpoint path */
  apiEndpoint: string;
  /** Exam name (e.g. "DNB", "Baccalauréat") */
  examName: string;
  /** Short exam label for UI (e.g. "DNB 2024", "Bac 2024") */
  examLabel: string;
  /** Session year for exam results */
  examSession: string;
  /** IPS year label */
  ipsYear: string;
  /** GitHub source repo URL */
  githubUrl: string;
  /** Page title for SEO */
  seoTitle: string;
  /** Meta description for SEO */
  seoDescription: string;
  /** Loading message */
  loadingMessage: string;
  /** Search placeholder */
  searchPlaceholder: string;
  /** About page intro text */
  aboutIntro: string;
  /** About page description */
  aboutDescription: string;
  /** Data source datasets for the about page */
  dataSources: DataSource[];
  /** About page explanation paragraphs */
  aboutExplanation: string[];
}

export interface DataSource {
  name: string;
  id: string;
  description: string;
  year: string;
}

const collegesConfig: DatasetConfig = {
  id: "colleges",
  labelSingular: "collège",
  labelPlural: "collèges",
  labelPluralTitle: "Collèges",
  apiEndpoint: "/api/colleges",
  examName: "DNB",
  examLabel: "DNB 2024",
  examSession: "2024",
  ipsYear: "2024-2025",
  githubUrl: "https://github.com/RemiSaurel/french-schools-map",
  seoTitle: "Carte des collèges en France - IPS et résultats au DNB",
  seoDescription: "Explorez les collèges en France : indice de position sociale (IPS) et résultats au DNB de chaque collège, sur une carte interactive.",
  loadingMessage: "Récupération et agrégation de ~7 000 collèges depuis data.education.gouv.fr",
  searchPlaceholder: "Rechercher un collège ou une ville\u2026",
  aboutIntro: "Ce projet explore les données des collèges en France en croisant l'indice de position sociale (IPS) avec les résultats au diplôme national du brevet (DNB).",
  aboutDescription: "Chaque point sur la carte représente un collège, coloré selon son IPS, avec ses résultats détaillés accessibles en un clic.",
  dataSources: [
    {
      name: "Indice de Position Sociale (IPS)",
      id: "fr-en-ips-colleges-ap2023",
      description: "Indice synthétique de la position sociale des élèves, calculé par la DEPP à partir des professions des parents. Plus l'IPS est élevé, plus le contexte socio-économique est favorable.",
      year: "2024-2025",
    },
    {
      name: "Indicateurs de valeur ajoutée des collèges (IVAC)",
      id: "fr-en-indicateurs-valeur-ajoutee-colleges",
      description: "Taux de réussite au DNB, notes moyennes, mentions, et valeur ajoutée de chaque collège par rapport à ce qu'on attend compte tenu de sa sociologie.",
      year: "Session 2024",
    },
    {
      name: "Annuaire de l'éducation",
      id: "fr-en-annuaire-education",
      description: "Coordonnées géographiques, adresse, secteur (public/privé), académie et commune de chaque établissement scolaire.",
      year: "Mis à jour en continu",
    },
  ],
  aboutExplanation: [
    "Les trois jeux de données sont croisés côté serveur via le code UAI (identifiant unique de chaque établissement). Seuls les collèges présents dans les trois sources sont affichés, soit environ 7 000 collèges.",
    "L'IPS utilisé correspond à la rentrée 2024-2025, les résultats au DNB à la session 2024. La valeur ajoutée mesure l'écart entre le taux de réussite observé et celui attendu compte tenu de la composition sociale de l'établissement.",
  ],
};

const lyceesConfig: DatasetConfig = {
  id: "lycees",
  labelSingular: "lycée",
  labelPlural: "lycées",
  labelPluralTitle: "Lycées",
  apiEndpoint: "/api/lycees",
  examName: "Baccalauréat",
  examLabel: "Bac 2024",
  examSession: "2024",
  ipsYear: "2024-2025",
  githubUrl: "https://github.com/RemiSaurel/french-schools-map",
  seoTitle: "Carte des lycées en France - IPS et résultats au Baccalauréat",
  seoDescription: "Explorez les lycées en France : indice de position sociale (IPS) et résultats au baccalauréat de chaque lycée, sur une carte interactive.",
  loadingMessage: "Récupération et agrégation de ~3 600 lycées depuis data.education.gouv.fr",
  searchPlaceholder: "Rechercher un lycée ou une ville\u2026",
  aboutIntro: "Ce projet explore les données des lycées en France en croisant l'indice de position sociale (IPS) avec les résultats au baccalauréat.",
  aboutDescription: "Chaque point sur la carte représente un lycée, coloré selon son IPS, avec ses résultats détaillés accessibles en un clic.",
  dataSources: [
    {
      name: "Indice de Position Sociale (IPS)",
      id: "fr-en-ips-lycees-ap2023",
      description: "Indice synthétique de la position sociale des élèves, calculé par la DEPP à partir des professions des parents. Plus l'IPS est élevé, plus le contexte socio-économique est favorable.",
      year: "2024-2025",
    },
    {
      name: "Indicateurs de résultats des lycées GT",
      id: "fr-en-indicateurs-de-resultat-des-lycees-gt_v2",
      description: "Taux de réussite au baccalauréat, taux de mentions, et valeur ajoutée de chaque lycée par rapport à ce qu'on attend compte tenu de sa sociologie.",
      year: "Session 2024",
    },
    {
      name: "Annuaire de l'éducation",
      id: "fr-en-annuaire-education",
      description: "Coordonnées géographiques, adresse, secteur (public/privé), académie et commune de chaque établissement scolaire.",
      year: "Mis à jour en continu",
    },
  ],
  aboutExplanation: [
    "Les trois jeux de données sont croisés côté serveur via le code UAI (identifiant unique de chaque établissement). Seuls les lycées présents dans les trois sources sont affichés, soit environ 3 600 lycées.",
    "L'IPS utilisé correspond à la rentrée 2024-2025, les résultats au baccalauréat à la session 2024. La valeur ajoutée mesure l'écart entre le taux de réussite observé et celui attendu compte tenu de la composition sociale de l'établissement.",
  ],
};

const DATASET_CONFIGS: Record<DatasetId, DatasetConfig> = {
  colleges: collegesConfig,
  lycees: lyceesConfig,
};

/**
 * Get dataset configuration by ID.
 * Falls back to "colleges" if the ID is invalid.
 */
export function getDatasetConfig(id: string): DatasetConfig {
  if (id in DATASET_CONFIGS) {
    return DATASET_CONFIGS[id as DatasetId];
  }
  return DATASET_CONFIGS.colleges;
}
