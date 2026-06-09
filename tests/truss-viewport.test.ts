import { describe, expect, it } from 'vitest';
import { createTrussViewport, trussToSvgX, trussToSvgY } from '../src/lib/ui/trussViewport';

describe('truss viewport helpers', () => {
  it('centers and scales truss coordinates into the SVG viewport', () => {
    const viewport = createTrussViewport(
      [
        { position: { x: 0, y: 0 } },
        { position: { x: 4, y: 2 } },
      ],
      750,
      350,
      50
    );

    expect(viewport.cx).toBe(2);
    expect(viewport.cy).toBe(1);
    expect(viewport.scale).toBe(125);
    expect(trussToSvgX(viewport, 2)).toBe(375);
    expect(trussToSvgY(viewport, 1)).toBe(175);
  });

  it('uses a stable fallback span for empty or collapsed geometry', () => {
    const viewport = createTrussViewport([], 750, 350, 50);
    expect(viewport.spanX).toBe(10);
    expect(viewport.spanY).toBe(5);

    const collapsed = createTrussViewport([{ position: { x: 2, y: 2 } }], 750, 350, 50);
    expect(collapsed.spanX).toBe(1);
    expect(collapsed.spanY).toBe(1);
  });
});
