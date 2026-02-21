import type { FilterState, SchoolFeature, SchoolGeoJSON } from "~/utils/types";
import { DROM_COM_REGIONS, IPS_MAX, IPS_MIN, normalizeText } from "~/utils/types";

export function useSchools() {
  const dataset = useDataset();

  const { data, status, error } = useFetch<SchoolGeoJSON>(dataset.apiEndpoint, {
    lazy: true,
  });

  const isColleges = dataset.id === "colleges";

  const filters = reactive<FilterState>({
    regions: [],
    academies: [],
    secteur: "",
    ipsRange: [IPS_MIN, IPS_MAX],
    search: "",
    locationMode: "metropolitan",
    typeLycee: [],
    tauxReussiteRange: null,
    valeurAjouteeRange: null,
    noteEcritRange: null,
    nbCandidatsRange: null,
  });

  const selectedSchool = ref<SchoolFeature | null>(null);

  // Comparison state - stores up to 2 schools for head-to-head comparison
  const comparisonSchools = ref<SchoolFeature[]>([]);

  // Comparison mode - whether comparison panel is open and ready to receive selections
  const comparisonModeEnabled = ref(false);

  // Check if any exam filter is active
  const hasExamFilters = computed(() => {
    return filters.tauxReussiteRange !== null
      || filters.valeurAjouteeRange !== null
      || filters.noteEcritRange !== null
      || filters.nbCandidatsRange !== null;
  });

  // Check if any non-region filters are active (for smart zoom)
  const hasNonRegionFilters = computed(() => {
    return filters.secteur !== ""
      || filters.typeLycee.length > 0
      || filters.academies.length > 0
      || filters.ipsRange[0] !== IPS_MIN
      || filters.ipsRange[1] !== IPS_MAX
      || filters.search !== ""
      || hasExamFilters.value;
  });

  // Comparison computed properties
  const canAddToComparison = computed(() => comparisonSchools.value.length < 2);
  const hasComparison = computed(() => comparisonSchools.value.length === 2);
  const isInComparison = (uai: string): boolean => comparisonSchools.value.some(c => c.properties.uai === uai);

  const filteredFeatures = computed(() => {
    if (!data.value?.features)
      return [];

    return data.value.features.filter((f) => {
      const p = f.properties;

      // Location filters
      if (filters.regions.length > 0 && !filters.regions.includes(p.region))
        return false;
      if (filters.locationMode === "metropolitan" && DROM_COM_REGIONS.includes(p.region))
        return false;
      if (filters.locationMode === "drom-com" && !DROM_COM_REGIONS.includes(p.region))
        return false;
      if (filters.secteur && p.secteur !== filters.secteur)
        return false;

      // Lycée type filter (général / professionnel / polyvalent)
      if (filters.typeLycee.length > 0 && p.type_lycee !== null && !filters.typeLycee.includes(p.type_lycee))
        return false;

      // IPS filter
      if (p.ips < filters.ipsRange[0] || p.ips > filters.ipsRange[1])
        return false;

      // Académie filter
      if (filters.academies.length > 0 && !filters.academies.includes(p.academie))
        return false;

      // Search filter (accent-insensitive)
      if (filters.search) {
        const search = normalizeText(filters.search);
        const matchName = normalizeText(p.nom).includes(search);
        const matchCommune = normalizeText(p.commune).includes(search);
        if (!matchName && !matchCommune)
          return false;
      }

      // Exclude schools without exam data when any exam filter is active
      if (hasExamFilters.value && p.taux_reussite === null)
        return false;

      // Exam Filters - Taux de réussite
      if (filters.tauxReussiteRange) {
        const val = p.taux_reussite;
        if (val === null || val < filters.tauxReussiteRange[0] || val > filters.tauxReussiteRange[1]) {
          return false;
        }
      }

      // Exam Filters - Valeur ajoutée
      if (filters.valeurAjouteeRange) {
        const val = p.valeur_ajoutee;
        if (val === null || val < filters.valeurAjouteeRange[0] || val > filters.valeurAjouteeRange[1]) {
          return false;
        }
      }

      // Exam Filters - Note écrit (colleges only)
      if (filters.noteEcritRange) {
        const val = p.note_ecrit;
        if (val === null || val < filters.noteEcritRange[0] || val > filters.noteEcritRange[1]) {
          return false;
        }
      }

      // Exam Filters - Nb candidats
      if (filters.nbCandidatsRange) {
        const val = p.nb_candidats;
        if (val === null || val < filters.nbCandidatsRange[0] || val > filters.nbCandidatsRange[1]) {
          return false;
        }
      }

      return true;
    });
  });

  const stats = computed(() => {
    const features = filteredFeatures.value;
    if (!features.length)
      return null;

    const ipsValues = features.map(f => f.properties.ips);
    const avgIps = ipsValues.reduce((a, b) => a + b, 0) / ipsValues.length;

    // Filter schools with exam data
    const withExamData = features.filter(f => f.properties.taux_reussite !== null);

    // Calculate exam averages
    const avgReussite = withExamData.length
      ? withExamData.reduce((a, f) => a + (f.properties.taux_reussite ?? 0), 0) / withExamData.length
      : null;

    const withVa = withExamData.filter(f => f.properties.valeur_ajoutee !== null);
    const avgValeurAjoutee = withVa.length
      ? withVa.reduce((a, f) => a + (f.properties.valeur_ajoutee ?? 0), 0) / withVa.length
      : null;

    const withNote = withExamData.filter(f => f.properties.note_ecrit !== null);
    const avgNoteEcrit = withNote.length
      ? withNote.reduce((a, f) => a + (f.properties.note_ecrit ?? 0), 0) / withNote.length
      : null;

    // Taux de mentions (lycees-specific, but computed generically)
    const withTauxMentions = withExamData.filter(f => f.properties.taux_mentions !== null);
    const avgTauxMentions = withTauxMentions.length
      ? withTauxMentions.reduce((a, f) => a + (f.properties.taux_mentions ?? 0), 0) / withTauxMentions.length
      : null;

    // Sum of nb_candidats across all schools with exam data
    const totalCandidats = withExamData.length
      ? withExamData.reduce((sum, f) => sum + (f.properties.nb_candidats ?? 0), 0)
      : null;

    return {
      count: features.length,
      countWithExam: withExamData.length,
      totalCandidats,
      avgIps: Math.round(avgIps * 10) / 10,
      avgReussite: avgReussite ? Math.round(avgReussite * 10) / 10 : null,
      avgValeurAjoutee: avgValeurAjoutee ? Math.round(avgValeurAjoutee * 10) / 10 : null,
      avgNoteEcrit: avgNoteEcrit ? Math.round(avgNoteEcrit * 10) / 10 : null,
      avgTauxMentions: avgTauxMentions ? Math.round(avgTauxMentions * 10) / 10 : null,
      minIps: Math.round(Math.min(...ipsValues) * 10) / 10,
      maxIps: Math.round(Math.max(...ipsValues) * 10) / 10,
    };
  });

  function selectSchool(feature: SchoolFeature | null): void {
    selectedSchool.value = feature;

    // Comparison mode: If comparison panel is open, add schools to comparison
    if (feature && comparisonModeEnabled.value && !isInComparison(feature.properties.uai)) {
      addToComparison(feature);
      return;
    }

    // Auto-add to comparison UX: If there's already 1 school in comparison
    // and we're selecting a different school, add it automatically
    if (feature
      && comparisonSchools.value.length === 1
      && !isInComparison(feature.properties.uai)
    ) {
      addToComparison(feature);
    }
  }

  // Comparison actions
  function addToComparison(school: SchoolFeature): void {
    if (comparisonSchools.value.length >= 2)
      return;
    if (isInComparison(school.properties.uai))
      return;
    comparisonSchools.value.push(school);
  }

  function removeFromComparison(uai: string): void {
    comparisonSchools.value = comparisonSchools.value.filter(c => c.properties.uai !== uai);
  }

  function clearComparison(): void {
    comparisonSchools.value = [];
  }

  function resetFilters(): void {
    filters.regions = [];
    filters.academies = [];
    filters.secteur = "";
    filters.ipsRange = [IPS_MIN, IPS_MAX];
    filters.search = "";
    filters.locationMode = "metropolitan";
    filters.typeLycee = [];
    filters.tauxReussiteRange = null;
    filters.valeurAjouteeRange = null;
    filters.noteEcritRange = null;
    filters.nbCandidatsRange = null;
    selectedSchool.value = null;
  }

  return {
    data,
    status,
    error,
    dataset,
    isColleges,
    filters,
    filteredFeatures,
    selectedSchool,
    stats,
    hasExamFilters,
    hasNonRegionFilters,
    selectSchool,
    resetFilters,
    // Comparison
    comparisonSchools,
    comparisonModeEnabled,
    canAddToComparison,
    hasComparison,
    isInComparison,
    addToComparison,
    removeFromComparison,
    clearComparison,
  };
}
