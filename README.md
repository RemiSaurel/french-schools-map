# Carte des Établissements Scolaires en France

Interactive map visualizing French schools (collèges and lycées) with social position index (IPS) and exam results (DNB / Baccalauréat). A single codebase deployed as two independent GitHub Pages apps, switched via the `NUXT_PUBLIC_DATASET` environment variable.

## Live Apps

- **Collèges** — ~7,000 middle schools with DNB results
- **Lycées** — ~3,600 high schools with Baccalauréat results

## Stack

- **Framework:** Nuxt 4.3 (Vue 3.5, TypeScript strict)
- **UI:** Nuxt UI v4 (Tailwind CSS v4)
- **Map:** MapLibre GL 5.17
- **Animation:** Motion-v 1.10
- **Package Manager:** pnpm 10.28

## Development

```bash
pnpm install          # Install dependencies
pnpm dev:colleges     # Collèges dataset (localhost:3000)
pnpm dev:lycees       # Lycées dataset (localhost:3000)
pnpm build            # Production build (uses NUXT_PUBLIC_DATASET)
pnpm preview          # Preview production build
pnpm lint             # Run ESLint
pnpm typecheck        # Run TypeScript checks
```

The active dataset is controlled by the `NUXT_PUBLIC_DATASET` env var (`"colleges"` or `"lycees"`).

## Data Sources

All data sourced from [data.education.gouv.fr](https://data.education.gouv.fr)

### Collèges
- **IPS** (`fr-en-ips-colleges-ap2023`) — Social position index, rentrée 2024-2025
- **IVAC** (`fr-en-indicateurs-valeur-ajoutee-colleges`) — DNB results + value-added, session 2024
- **Annuaire** (`fr-en-annuaire-education`) — GPS coordinates and school metadata

### Lycées
- **IPS** (`fr-en-ips-lycees-ap2023`) — Social position index, rentrée 2024-2025
- **Bac GT** (`fr-en-indicateurs-de-resultat-des-lycees-gt_v2`) — Bac results for Général/Technologique, session 2024
- **Annuaire** (`fr-en-annuaire-education`) — GPS coordinates and school metadata

> Note: The Bac GT dataset only covers LEGT schools. LP (Professionnel) and LPO (Polyvalent) schools appear on the map with IPS data but no exam results.

## Architecture

```
app/
├── components/    # Vue components (CollegeMap, FilterSidebar, InfoCard, etc.)
├── composables/   # Composables (useSchools, useDataset)
├── config/        # Dataset configuration (dataset.ts)
├── pages/         # Routes (index, about)
├── utils/         # Types, colors, formatting utilities
└── app.config.ts  # UI configuration

server/
├── api/           # API endpoints (colleges.get.ts, lycees.get.ts)
└── utils/         # Server utilities (education-api.ts, types.ts)
```

## Key Features

- Single codebase, two independent deployments (collèges / lycées)
- Real-time filtering by region, sector, IPS range, exam metrics
- Lycée type filter: Général (LEGT), Professionnel (LP), Polyvalent (LPO)
- Interactive map with hover tooltips and smart zoom
- Animated histogram visualization
- School comparison panel (side-by-side)
- Responsive sidebar with collapsible accordion sections

## Contributing

See [AGENTS.md](./AGENTS.md) for coding conventions and development guidelines.

## License

MIT
