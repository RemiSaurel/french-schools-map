import type { SchoolFeature } from "~/utils/types";

interface MentionsPct {
  tb: number;
  b: number;
  ab: number;
  sans: number;
}

interface VaLabel {
  text: string;
  color: string;
  icon: string;
}

export function useSchoolComparison() {
  /**
   * Calculate mentions percentages from a school's data
   */
  function getMentionsPct(school: SchoolFeature): MentionsPct | null {
    const p = school.properties;
    if (!p.nb_candidats || !p.mentions_tb)
      return null;

    const total = p.nb_candidats;
    const tb = ((p.mentions_tb ?? 0) / total) * 100;
    const b = ((p.mentions_b ?? 0) / total) * 100;
    const ab = ((p.mentions_ab ?? 0) / total) * 100;
    const sans = 100 - tb - b - ab;

    return { tb, b, ab, sans };
  }

  /**
   * Get valeur ajoutée label with color and icon
   */
  function getVaLabel(school: SchoolFeature): VaLabel | null {
    const va = school.properties.valeur_ajoutee;
    if (va === null || va === undefined || Number.isNaN(va))
      return null;

    const vaNum = va === 0 ? 0 : va;
    if (vaNum > 2)
      return { text: `+${vaNum}`, color: "text-green-600", icon: "i-lucide-trending-up" };
    if (vaNum < -2)
      return { text: `${vaNum}`, color: "text-red-600", icon: "i-lucide-trending-down" };
    return { text: `${vaNum > 0 ? "+" : ""}${vaNum}`, color: "text-zinc-500", icon: "i-lucide-minus" };
  }

  /**
   * Get VA note écrit label with color and icon (uses tighter +/-0.5 thresholds for /20 scale)
   */
  function getVaNoteLabel(school: SchoolFeature): VaLabel | null {
    const va = school.properties.va_note_ecrit;
    if (va === null || va === undefined || Number.isNaN(va))
      return null;

    const vaNum = va === 0 ? 0 : va;
    const formatted = vaNum.toFixed(1);
    if (vaNum > 0.5)
      return { text: `+${formatted}`, color: "text-green-600", icon: "i-lucide-trending-up" };
    if (vaNum < -0.5)
      return { text: formatted, color: "text-red-600", icon: "i-lucide-trending-down" };
    return { text: `${vaNum > 0 ? "+" : ""}${formatted}`, color: "text-zinc-500", icon: "i-lucide-minus" };
  }

  return {
    getMentionsPct,
    getVaLabel,
    getVaNoteLabel,
  };
}
