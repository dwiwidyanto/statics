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

## 🕸️ Stage 3A: Truss Domain Foundation & Solver

We have successfully implemented the truss domain foundation and joint equilibrium solver:
- **Truss Domain Models**: Added planar pin-jointed truss representation in `src/lib/domain/truss/types.ts`.
- **Method of Joints Solver**: Programmatic pre-solving of $3 \times 3$ support reactions followed by joint-by-joint marching equations in `src/lib/domain/truss/solver.ts`.
- **Zero-force Member Rules**: Automatically detects Rule 1 (unloaded/unsupported joint with two non-collinear members) and Rule 2 (unloaded/unsupported joint with three members, two of which are collinear), propagating the results iteratively.
- **Truss Workspace**: Interactive SVG canvas rendering tension (blue), compression (red), and zero-force (gray/dashed) members, with bilingual selector, results table, and joint equations panel.

### New Hash Routes:
- `#/trusses` - Truss Practice workspace dashboard.
- `#/trusses/:problemId` - Load a specific truss problem directly (e.g. `#/trusses/truss-simple-triangle`).

### Quality Gate Commands:
Ensure all systems remain operational with:
```bash
npm run test     # Run all 43 Vitest tests
npm run check    # Verify zero TypeScript and Svelte diagnostics
npm run build    # Compile production client bundles
```

