export interface TopicSection {
  id: string;
  title: string;
  summary: string;
  contentMarkdown: string;
}

export const staticsTopics: TopicSection[] = [
  {
    id: 'intro-to-statics',
    title: '1. Introduction to Statics',
    summary: 'What is statics and why does it matter in engineering?',
    contentMarkdown: `
### What is Statics?
**Statics** is the branch of mechanics that addresses bodies at rest or moving at a constant velocity. In either state, the acceleration of the body is exactly zero:
$$\\vec{a} = 0, \\quad \\vec{\\alpha} = 0$$

According to Newton's Second Law ($F = ma$), this means the sum of all external forces and moments acting on the system is zero.

### Why is Statics Important?
Statics is the foundation for analyzing structures such as:
- Bridges
- Buildings
- Trusses
- Machine elements

Before you can calculate if a steel beam will bend or break (Mechanics of Materials) or design its dimensions, you must calculate the **forces acting on it**.

### The Rigid Body Assumption
In introductory statics, we assume bodies are **perfectly rigid**. This means they do not deform (stretch, bend, or twist) under applied loads. In reality, all materials deform slightly, but for determining support reactions, the rigid-body assumption is a highly accurate simplification.
`
  },
  {
    id: 'fbd-basics',
    title: '2. Free-Body Diagrams (FBD)',
    summary: 'The most important tool in engineering mechanics.',
    contentMarkdown: `
### What is a Free-Body Diagram?
A **Free-Body Diagram (FBD)** is a graphical sketch used by engineers to visualize the forces and moments acting on a body. It is "free" because the body is isolated from its surroundings, with all contact points replaced by equivalent forces and moments.

### Essential Steps to Draw an FBD:
1. **Isolate the Body**: Draw the outline of the body alone, removed from the ground, walls, or other connected components.
2. **Add Active Forces**: Place all known external loads acting on the body (e.g., gravity/weight, applied point forces, distributed loads, applied moments).
3. **Add Reactive Forces (Reactions)**: At every location where the body was touching a support, draw the unknown reaction forces and moments that prevent the body from moving.
4. **Define a Coordinate System**: Explicitly draw an $x$-$y$ axis to define positive directions (usually $+x$ right, $+y$ up, $+M$ counter-clockwise).
5. **Label Everything**: Use letters (e.g., $F_1$, $w$, $M$) and angles to label all loads, and support symbols (e.g., $R_{Ax}$, $R_{Ay}$) for reactions.

> [!IMPORTANT]
> **Common Student Mistake:** Forgetting to draw reaction forces, or drawing them in directions that the support cannot actually resist (e.g., drawing a moment reaction on a pin joint).
`
  },
  {
    id: 'supports-and-reactions',
    title: '3. Supports and Reactions',
    summary: 'How supports restrict movement and create reaction forces.',
    contentMarkdown: `
### Support Reactions Concept
A support restricts the motion of a body. According to Newton's Third Law (action-reaction), if a support prevents a body from translating or rotating in a certain direction, it must exert a force or moment on the body in that direction.

| Support Type | Diagram Symbol | Allowed Motion | Restrained Motion (Reactions) | Number of Unknowns |
| :--- | :---: | :--- | :--- | :---: |
| **Roller** | Triangle with wheels / circle | Translation along surface, rotation | Translation normal to surface (Force perpendicular to roller surface) | **1** ($R_y$ or $R_x$) |
| **Pin / Hinge** | Triangle pinned to ground | Rotation only | Horizontal and Vertical translation (Force in X and Y) | **2** ($R_x$, $R_y$) |
| **Fixed Support** | Beam embedded in wall | None | Translation in X and Y, and rotation (Forces in X and Y, and Moment $M$) | **3** ($R_x$, $R_y$, $M$) |

### Details:
- **Roller Support:** Allows the structure to expand/contract horizontally (e.g., due to temperature shifts) without creating stress. It only supports vertical loads (if resting on a horizontal floor).
- **Pin Support:** Connects a member allowing it to hinge freely. It prevents it from lifting or sliding but cannot prevent it from pivoting.
- **Fixed Support:** Represents a member welded or deeply bolted into a wall. It resists translation and prevents rotation completely.
`
  },
  {
    id: 'equilibrium-equations',
    title: '4. Equilibrium Equations',
    summary: 'The three equations that govern 2D rigid-body statics.',
    contentMarkdown: `
### The Equations of Equilibrium
For a 2D planar system, there are three independent equations of equilibrium. These assert that the body does not translate horizontally, does not translate vertically, and does not rotate:

$$\\sum F_x = 0$$
$$\\sum F_y = 0$$
$$\\sum M_P = 0$$

Where $M_P$ represents the sum of moments about any arbitrary pivot point $P$ in space.

### Resolving Forces into Components
To use the force equations, you must resolve angled forces into horizontal and vertical components:
- $F_x = F \\cdot \\cos(\\theta)$
- $F_y = F \\cdot \\sin(\\theta)$

### Moment of a Force
The moment measures the tendency of a force to rotate a body about a pivot point $P$.
- Magnitude: $M_P = F \\cdot d$, where $d$ is the perpendicular distance (moment arm) from $P$ to the line of action of the force.
- Sign Convention: Counter-Clockwise (CCW) is positive ($+$), Clockwise (CW) is negative ($-$).
- In coordinate math:
  $$M_P = (x_F - x_P) F_y - (y_F - y_P) F_x$$

> [!TIP]
> **Solving Strategy:** When writing the moment equation $\\sum M_P = 0$, choose a pivot point $P$ where the lines of action of as many unknown reaction forces as possible intersect. This eliminates those unknowns from the equation, letting you solve for the remaining reactions directly!
`
  },
  {
    id: 'determinacy-stability',
    title: '5. Determinacy & Static Stability',
    summary: 'Classifying systems based on reactions and constraints.',
    contentMarkdown: `
### Classification of Planar Structures
Let $r$ be the number of unknown support reactions.
Let $n$ be the number of equations of equilibrium available (for a single rigid body, $n = 3$).

#### 1. Unstable ($r < 3$)
If there are fewer than 3 reactions, the structure is **under-restrained** and will move when load is applied.
- Example: A beam supported by only two rollers. It can roll horizontally.

#### 2. Statically Determinate ($r = 3$ and stable)
If there are exactly 3 reactions, and they are arranged properly to prevent all movements:
- The reactions can be uniquely solved using only the 3 equilibrium equations.
- Example: A pin support at one end, and a roller support at the other.

#### 3. Statically Indeterminate ($r > 3$ and stable)
If there are more than 3 reactions, the structure has **redundant supports**.
- It is stable, but we cannot solve for all reactions using statics alone.
- Example: A beam fixed at one end and pinned at the other ($3 + 2 = 5$ reactions).

### Geometric Instability (The Trap!)
A structure can have $r \\ge 3$ reactions but still be unstable due to poor arrangement:
- **Parallel Reactions:** If all reaction forces are parallel, the structure cannot resist motion in the perpendicular direction.
- **Concurrent Reactions:** If all reaction force lines of action intersect at a single point $Q$, the structure cannot resist rotation about $Q$.

> [!WARNING]
> **Why it matters:** Geometric instability leads to sudden structural collapse. An engineer must ensure supports are oriented to block translation in all axes and prevent rotation.
`
  }
];
