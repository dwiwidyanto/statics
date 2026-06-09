# StaticsLab MVP

An interactive, production-ready web application designed for undergraduate engineering students to learn 2D statics, free-body diagramming (FBD), support reaction calculations, and static stability.

This app is optimized for lightweight execution on low-spec student devices and containerized production deployment on **Coolify** servers with GitHub Continuous Integration (CI/CD).

---

## 🚀 Key Features

### Stage 0: Concept Curriculum
- **Interactive Concept Modules**: Structured guides on statics fundamentals, free-body diagrams, support reactions, equilibrium, and stability.
- **Academic Design**: Restrained, print-clear CSS layout that responds beautifully to dark/light modes.
- **No Heavy Libraries**: Pure HTML/CSS/TypeScript with Svelte 5 and custom lightweight markup parsers.

### Stage 1: Interactive FBD Sandbox
- **Vector Mechanics Canvas**: Native SVG engine rendering beams, blocks, support icons (pins, rollers, fixed joints), and force vectors.
- **Real-Time Matrix Solver**: Active 2D rigid-body solver calculating horizontal force $R_x$, vertical force $R_y$, and reaction moments $M_A$ using Gaussian elimination.
- **Static & Geometric Stability Checker**: Analyzes support degrees of freedom, parallel support instabilities, and concurrent lines of action (rotational collapse).
- **Educational Explanations Panel**: Gives student-friendly feedback explaining *why* a configuration is stable, indeterminate, or unstable.
- **Problem presets**: Includes simply-supported, cantilever, indeterminate, and geometrically unstable preset layouts.

### Stage 2A: Guided Beam Workspace & Diagrams
- **15 Guided Problems**: Structured curriculum ranging from simple point loads to complex distributed loads and moments.
- **Shear & Bending Diagrams**: Programmatic rendering of Shear Force Diagrams (SFD) and Bending Moment Diagrams (BMD) using exact analytical equations.
- **Inspection Tool**: Interactive cursor tracker showing coordinates and shear/moment values at any point along the beam.

### Stage 2B: Practice Progression & Local Progress
- **Hash-Based Router**: URL deep-linking support (`#/guided/beam-simply-supported-midpoint`) for sharing specific problems and saving navigation history.
- **Local Progress Repository**: Abstracted data interface storing student attempts in `localStorage` with automated data-corruption recovery.
- **Scoring & Tolerance Engine**: Compares student reaction inputs against reference solutions, supporting absolute (2 N) and relative (1%) tolerances and providing sign-reversal hints.
- **Gamified Dashboard**: Visual progress summary with completion indicators, topic performance analysis, and one-click "Continue Next Unsolved Problem".
- **Keyboard Accessibility**: Full keyboard navigation support (tabindex/focus/keydown handlers) on curriculum selection, FBD canvas nodes, and diagram hover inspectors.

---

## 📂 Project Architecture

The application uses a **domain-first modular architecture** to separate pure mathematics/engineering calculations from the UI presentation layer, ensuring future expandability.

```text
src/
  ├── app/
  │    ├── components/
  │    │    ├── TrussAnswerInputPanel.svelte # Interactive truss practice form
  │    │    ├── TrussPedagogyPanel.svelte    # Engineering theory reference card
  │    │    └── ...
  │    ├── layout/
  │    │    └── AppShell.svelte       # Main responsive navigation wrapper
  │    ├── pages/
  │    │    ├── Dashboard.svelte      # Homepage and preset select list
  │    │    ├── ConceptPage.svelte    # Curriculum viewer with markdown+math parsing
  │    │    ├── GuidedWorkspace.svelte# Guided beam solving workspace
  │    │    ├── PracticePage.svelte   # Sandbox orchestrator (state, controls)
  │    │    ├── ProgressPage.svelte   # Progress tracking dashboard
  │    │    └── TrussPracticePage.svelte # Guided truss practice page
  │    └── routing/
  │         └── router.ts             # Hash-based routing and attempt matching
  ├── content/
  │    ├── problems/
  │    │    ├── beam-problems.ts      # Guided beam problems
  │    │    ├── statics-problems.ts   # Sandbox preset problems
  │    │    └── truss-problems.ts     # Preloaded truss practice problems
  │    └── topics/
  │         └── statics-content.ts    # Concept curriculum pages database
  ├── features/
  │    # Placeholder folders ready for feature-specific modules
  │    ├── statics-fbd/
  │    ├── statics-equilibrium/
  │    └── learning-content/
  └── lib/
       ├── domain/
       │    ├── geometry/
       │    │    └── vector2d.ts      # 2D cross product, moments, angles
       │    ├── loads/
       │    │    └── load.ts          # Load component resolving & UDL resultants
       │    ├── models/
       │    │    └── types.ts         # Central Domain Models (Point, Load, Support, Reaction)
       │    ├── progress/
       │    │    ├── types.ts         # Attempt and aggregate stats definitions
       │    │    └── scoring.ts       # Reaction checking and tolerances
       │    ├── solvers/
       │    │    └── equilibrium.ts   # 3x3 Equation builder and Gaussian solver
       │    ├── supports/
       │    │    └── support.ts       # Support reaction maps (pin, roller, fixed)
       │    ├── truss/                # Planar truss domain package
       │    │    ├── types.ts         # Truss models and solver output types
       │    │    ├── scoring.ts       # Reaction and member force checks (30%/70%)
       │    │    ├── validation.ts    # Model connectivity checks
       │    │    ├── geometry.ts      # Unit vector and moment solvers
       │    │    ├── supportReactions.ts # Cramer's rule reactions solver
       │    │    ├── zeroForceMembers.ts # ZFM Rule 1 & Rule 2 propagation
       │    │    ├── methodOfJoints.ts # Marching joints equilibrium solver
       │    │    ├── equilibriumCheck.ts # Residual joints checker
       │    │    └── solver.ts        # Unified public solver API wrapper
       │    └── validation/
       │         └── checker.ts       # Stability & degrees-of-freedom validator
       ├── services/
       │    ├── localProgressRepository.ts # localStorage progress repository
       │    └── progressRepository.ts # Progress storage interface definition
       ├── ui/
       │    ├── FbdCanvas.svelte      # SVG diagram engine (force arrows, wheels, pivot)
       │    ├── FeedbackPanel.svelte  # Diagnostic warning blocks
       │    ├── EquationsView.svelte  # ΣFx=0, ΣFy=0, ΣM=0 step-by-step assembly
       │    └── TrussCanvas.svelte    # SVG truss diagram rendering
       └── utils/
tests/
  ├── beam-diagrams.test.ts
  ├── problem-metadata.test.ts
  ├── progress.test.ts
  ├── router.test.ts
  ├── scoring.test.ts
  ├── statics-solver.test.ts
  ├── truss-metadata.test.ts          # Validates truss problem definition geometry
  ├── truss-scoring.test.ts           # Tests tolerances and feedback messages
  └── truss-solver.test.ts            # Tests joint-by-joint Cramer's solver
Dockerfile                            # Multi-stage production container configuration
nginx.conf                            # Nginx static server rules for Svelte SPA fallback routing
```

---

## 🛠️ Local Development

### Prerequisites
- Node.js (v18 or v20+)
- npm

### Installation
1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd statics-lab
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

### Running Tests
Run unit tests for pure statics logic:
```bash
npm run test
# Or run with Vitest directly:
npx vitest run
```

---

## 🐳 Coolify Deployment

StaticsLab is fully containerized and ready for instant deployment on any Coolify instance using your GitHub repository.

### Config Steps in Coolify Dashboard:
1. Create a **New Resource** -> **Public/Private Repository**.
2. Select your repository and branch.
3. In **Build Pack**, select **Dockerfile**.
4. Click **Deploy**.

### Port Configuration:
- Coolify maps requests to your container automatically.
- The `Dockerfile` exposes **Port 80**. Ensure your Coolify configuration routes public domain requests to container port `80`.

---

## 🕸️ Stage 3: Planar Truss Modules

### Stage 3A: Truss Domain Foundation & Solver
- **Truss Domain Models**: Added planar pin-jointed truss representation in `src/lib/domain/truss/types.ts`.
- **Method of Joints Solver**: Programmatic pre-solving of $3 \times 3$ support reactions followed by joint-by-joint marching equations in `src/lib/domain/truss/solver.ts`.
- **Zero-force Member Rules**: Automatically detects Rule 1 (unloaded/unsupported joint with two non-collinear members) and Rule 2 (unloaded/unsupported joint with three members, two of which are collinear), propagating the results iteratively.
- **Truss Workspace**: Interactive SVG canvas rendering tension (blue), compression (red), and zero-force (gray/dashed) members.

### Stage 3B: Guided Practice & Progress Scoring
- **Truss Practice Panel**: Input forms for external support reactions and member axial forces with detailed, tolerance-aware feedback and correct/incorrect status labels (Tension (+), Compression (-)).
- **Partial-Credit Scoring**: Balanced scoring engine utilizing a 30% reaction / 70% member forces weighted scoring schema with absolute (2 N) and relative (1%) tolerances.
- **Local Progress persistence**: Automatically saves practice attempts and aggregates statistics to localStorage.
- **Topic-Aware Routing Navigation**: Links attempts on the progress dashboard directly back to their corresponding workspace type.
- **Solver Refactoring & Pedagogy**: Modularized the truss solver into self-contained files (`validation.ts`, `geometry.ts`, `supportReactions.ts`, `zeroForceMembers.ts`, `methodOfJoints.ts`, `equilibriumCheck.ts`), and created theory panels explaining equations and sign conventions.

### Stage 3C: Guided Learning Telemetry, Progressive Hints, and Attempt Review Mode
- Implemented telemetry recording for each step of guided problems, storing snapshots of student answers.
- Added progressive hint system that reveals hints based on attempt count and correctness.
- Created Attempt Review page (`#/progress/attempt/:attemptId`) for replaying attempts with detailed analytics.
- Ensured backward compatibility with existing localStorage data.

### Stage 3D: Learning Analytics Hardening, Attempt Review Refactor, and Student Export
- Refactored `AttemptReviewPage.svelte` into modular components under `src/app/components/attempt-review/`.
- Extracted truss determinacy helpers to `src/lib/domain/truss/determinacy.ts` with comprehensive unit tests.
- Typed telemetry snapshots with discriminated unions in `src/lib/domain/progress/types.ts`.
- Centralized misconception definitions in `src/content/learning/misconceptions.ts`.
- Implemented pure analytics module `src/lib/domain/progress/analytics.ts` computing skill scores, trends, weakest skill, and recommendations.
- Added local export/import of progress JSON with validation (`src/lib/services/progressExport.ts`).
- Updated Progress dashboard UI to display analytics and export/import controls.
- Cleaned repository hygiene (removed trailing whitespace) and ensured all quality gates pass.

### Stage 3E: Analytics Robustness and Progress Portability
- Typed guided telemetry snapshots use discriminated unions in `src/lib/domain/progress/types.ts`.
- Legacy and malformed `localStorage` progress data is normalized through `src/lib/domain/progress/telemetryMigration.ts`.
- Attempt replay reconstruction is isolated in `src/lib/domain/progress/attemptReplay.ts`.
- Misconception definitions are centralized in `src/lib/domain/learning/misconceptions.ts`.
- Local progress export/import is available from the Progress page with merge/replace modes and validation warnings.
- Learning readiness recommendations are generated by `src/lib/domain/progress/recommendations.ts`.

### Stage 3F: Guided Scoring Integrity
- Browser tab title cleaned to `statics`.
- Guided telemetry scoring uses one centralized weight definition in `guidedTelemetry.ts`.
- Final saved attempts are built from domain-level telemetry finalization.
- Completion requires actual evidence for required guided steps and member-force coverage.
- Added tests covering incomplete telemetry, hints, repeated wrong attempts, missing member-force evidence, and saved score consistency.

### Stage 3G: Production Hardening and Classroom Export
- Route parsing/building now explicitly covers guided truss and attempt review routes with round-trip tests.
- Progress import reports imported, skipped, and duplicate attempts and keeps imported attempts sorted consistently.
- Progress page includes a local-only CSV instructor export for classroom review.
- Beam and truss problems include readiness metadata for prerequisites, skill tags, module order, and recommended next IDs.
- Learning recommendations use metadata to prefer prerequisites and easier unsolved problems before advanced ones.
- Progress header was extracted to a focused component as a first maintainability step.

### Stage 3H: Progress Import Safety and Dashboard Refactor
- Progress import decisions are planned by `progressImportPlan.ts` before repository data is mutated.
- Replace import with zero valid attempts is blocked by default and requires a visibly separate dangerous confirmation.
- Import results now report mode, schema version, valid attempts, added/replaced attempts, duplicate skips, invalid skips, and warnings.
- `ProgressPage.svelte` was reduced to a page coordinator with import modal, result banner, diagnostics, recommendations, and actions extracted to components.
- Recent attempt and recommendation navigation decisions are covered by pure route helpers and tests.

### Current Learning Modules
- FBD and 2D equilibrium
- Beam support reactions
- SFD/BMD diagrams
- Truss analysis
- Guided method-of-joints workflow
- Local progress, misconception tracking, and attempt review

### Local Progress Portability
- Progress can be exported from `#/progress` as a versioned JSON file containing `schemaVersion`, `exportedAt`, `appName`, `appVersion`, `generatedBy`, `attemptCount`, and `attempts`.
- Progress can be imported back into the same browser or another browser using merge or replace mode.
- Replace mode can erase local progress; imports with zero valid attempts are blocked unless the user explicitly confirms the dangerous empty replace action.
- Instructor CSV export is available from `#/progress` and includes attempt id, problem id, topic, score, completion, timestamp, misconceptions, weakest skill, and hint usage.
- All progress data remains browser-local in `localStorage`; no backend or authentication is used yet.

### Developer Notes
- Guided telemetry is typed with discriminated snapshot unions.
- Legacy localStorage data is normalized through `telemetryMigration.ts` before the app uses it.
- Misconception definitions are centralized and should not be duplicated in UI components.

### Active Application Routes
- `#/` — Dashboard Home and Topic Selector
- `#/practice` — Sandbox FBD and Reaction Solver
- `#/practice/:problemId` — Sandbox Preset Load
- `#/guided/:problemId` — Guided Beam Workspace (SFD/BMD)
- `#/concept/:topicId` — Curriculum Concept Page
- `#/progress` — Student Progress Dashboard
- `#/progress/attempt/:attemptId` — Attempt Review page
- `#/trusses` — Truss practice selection page
- `#/trusses/:problemId` — Interactive Truss Workspace
- `#/trusses/:problemId/guided` — Guided method-of-joints workflow

### Quality Gate Commands
Ensure all systems remain operational with:
```bash
npm run test                  # Run all Vitest tests successfully
npm run check                 # Verify zero TypeScript and Svelte diagnostics
npm run build                 # Compile production client bundles
npm run test:all              # Run test, check, and build in sequence
npm audit --audit-level=moderate --omit=dev
```

StaticsLab remains a static Svelte SPA suitable for Coolify/Nginx deployment. Progress, imports, and instructor exports are local-only browser features; no backend or authentication is used yet.
