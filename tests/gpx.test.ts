import { describe, expect, it } from 'vitest';
import { exportGpx, parseGpx } from '../src/gpx';
import { validateRoute } from '../src/geo';
import type { RouteDocument } from '../src/types';

const reference: RouteDocument = {
  name: 'Deliberate canal line',
  track: [
    { lat: 51, lon: -1 }, { lat: 51.0005, lon: -0.9995 }, { lat: 51.0015, lon: -1.0005 },
    { lat: 51.0015, lon: -0.9985 }, { lat: 51.002, lon: -0.998 },
  ],
  intents: [
    { id: 'water-1', trackIndex: 1, kind: 'water', note: 'Tap & café <seasonal>', lockPoint: true, lockToNext: true },
    { id: 'surface-1', trackIndex: 3, kind: 'surface', note: 'Keep the towpath', lockPoint: true, lockToNext: false },
  ],
};

describe('GPX round trip', () => {
  it('preserves route geometry, notes, and locks', () => {
    const parsed = parseGpx(exportGpx(reference));
    expect(parsed.name).toBe(reference.name);
    expect(parsed.track).toHaveLength(5);
    expect(parsed.intents).toEqual(reference.intents);
  });

  it('accepts route points as well as track points', () => {
    const parsed = parseGpx('<?xml version="1.0"?><gpx><rte><name>Road</name><rtept lat="1" lon="2"></rtept><rtept lat="1.1" lon="2.1"></rtept></rte></gpx>');
    expect(parsed.track).toHaveLength(2);
    expect(parsed.name).toBe('Road');
  });

  it('rejects a file without usable geometry', () => {
    expect(() => parseGpx('<gpx><metadata /></gpx>')).toThrow(/No usable route line/);
  });
});

describe('intent validation', () => {
  it('passes the original route', () => {
    const report = validateRoute(reference, reference.track, 30);
    expect(report.pass).toBe(true);
    expect(report.checks).toHaveLength(3);
  });

  it('detects a shortcut around the locked segment', () => {
    const candidate = [reference.track[0], reference.track[1], reference.track[3], reference.track[4]];
    const report = validateRoute(reference, candidate, 30);
    expect(report.pass).toBe(false);
    expect(report.checks.some((check) => check.id.startsWith('segment-') && !check.pass)).toBe(true);
  });

  it('fails a geometry with fewer than two points', () => {
    expect(validateRoute(reference, [reference.track[0]], 75).pass).toBe(false);
  });
});
