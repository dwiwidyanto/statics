import { describe, expect, it } from 'vitest';
import { createFbdViewport, toMeterX, toMeterY, toSvgX, toSvgY } from '../src/lib/ui/fbdViewport';

describe('FBD viewport helpers', () => {
  const viewport = createFbdViewport({
    svgWidth: 750,
    svgHeight: 350,
    bodyWidth: 6,
    bodyHeight: 0.3,
  });

  it('creates the same scale used by the FBD canvas', () => {
    expect(viewport.centerX).toBe(375);
    expect(viewport.centerY).toBe(175);
    expect(viewport.scale).toBeCloseTo(500 / 6);
  });

  it('round-trips meter coordinates through svg coordinates', () => {
    const svgX = toSvgX(viewport, 4.2);
    const svgY = toSvgY(viewport, 0.2);
    expect(toMeterX(viewport, svgX)).toBe(4.2);
    expect(toMeterY(viewport, svgY)).toBe(0.2);
  });

  it('clamps pointer conversion to the body extents', () => {
    expect(toMeterX(viewport, -999)).toBe(0);
    expect(toMeterX(viewport, 9999)).toBe(6);
    expect(toMeterY(viewport, -999)).toBe(0.3);
    expect(toMeterY(viewport, 9999)).toBe(0);
  });
});
