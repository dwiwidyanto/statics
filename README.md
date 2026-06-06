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
  │    ├── layout/
  │    │    └── AppShell.svelte       # Main responsive navigation wrapper
  │    └── pages/
  │         ├── Dashboard.svelte      # Homepage and preset select list
  │         ├── ConceptPage.svelte    # Curriculum viewer with markdown+math parsing
  │         └── PracticePage.svelte   # Sandbox orchestrator (state, controls)
  ├── content/
  │    ├── problems/
  │    │    └── statics-problems.ts   # Preset problems list (supports, loads, expected state)
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
       │    ├── solvers/
       │    │    └── equilibrium.ts   # 3x3 Equation builder and Gaussian solver
       │    ├── supports/
       │    │    └── support.ts       # Support reaction maps (pin, roller, fixed)
       │    └── validation/
       │         └── checker.ts       # Stability & degrees-of-freedom validator
       ├── ui/
       │    ├── FbdCanvas.svelte      # SVG diagram engine (force arrows, wheels, pivot)
       │    ├── FeedbackPanel.svelte  # Diagnostic warning blocks
       │    └── EquationsView.svelte  # ΣFx=0, ΣFy=0, ΣM=0 step-by-step assembly
       └── utils/
tests/
  └── statics-solver.test.ts          # Pure domain logic vitest test suite
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

## 🚀 Future Expansion Guide (Stage 2+)

To add a new learning module (such as a **Truss Solver** or **Internal Shear & Bending Moment Diagrams**), follow this structured workflow:

### Step 1: Define Domain Models & Math Logic
1. Open `src/lib/domain/models/types.ts` and add any truss/internal force interfaces (e.g. `Joint`, `Member`, `ForceState`).
2. Create a new solver script under `src/lib/domain/solvers/truss.ts` containing the method of joints or method of sections solver logic in pure TypeScript.

### Step 2: Create Learning Content
1. Go to `src/content/topics/statics-content.ts` and add a new `TopicSection` object explaining truss mathematics.
2. Go to `src/content/problems/statics-problems.ts` and add truss presets.

### Step 3: Implement Visual Slices
1. Create custom visual renderers (e.g. drawing truss bars or shear graphs) under `src/lib/ui/`.
2. Add a new view file `src/app/pages/TrussPracticePage.svelte` to assemble the truss sandbox.

### Step 4: Route the View
1. Open `src/app/layout/AppShell.svelte` and enable/activate the "Truss Solver" navigation item.
2. Open `src/App.svelte` and add the state routing logic:
   ```svelte
   {#if currentPage === 'trusses'}
     <TrussPracticePage onNavigate={navigate} />
   {/if}
   ```
