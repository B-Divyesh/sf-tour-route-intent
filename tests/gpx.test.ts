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

  it('accepts standards-valid self-closing track and route points', () => {
    const track = parseGpx('<gpx version="1.1"><trk><trkseg><trkpt lat="51" lon="-1"/><trkpt lat="51.1" lon="-1.1" /></trkseg></trk></gpx>');
    const route = parseGpx('<gpx version="1.1"><rte><rtept lat="51" lon="-1"/><rtept lat="51.1" lon="-1.1"/></rte></gpx>');
    expect(track.track).toEqual(route.track);
    expect(track.track).toHaveLength(2);
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

  it('rejects a returned locked span that detours far away between every original vertex', () => {
    const verifierReference: RouteDocument = {
      name: 'Harbour to high pass',
      track: [
        { lat: 54.9681, lon: -3.1802 }, { lat: 54.9804, lon: -3.1421 }, { lat: 54.9918, lon: -3.1074 },
        { lat: 55.0128, lon: -3.0829 }, { lat: 55.0275, lon: -3.0402 }, { lat: 55.0516, lon: -3.0121 },
        { lat: 55.0683, lon: -2.9688 }, { lat: 55.0834, lon: -2.9239 }, { lat: 55.1024, lon: -2.881 },
      ],
      intents: [
        { id: 'surface', trackIndex: 2, kind: 'surface', note: 'Stay on the signed gravel towpath', lockPoint: true, lockToNext: true },
        { id: 'water', trackIndex: 5, kind: 'water', note: 'Reliable tap at the village hall', lockPoint: true, lockToNext: false },
      ],
    };
    const detour = { lat: 56.5, lon: -4.5 };
    const candidate = verifierReference.track.flatMap((point, index) => index >= 3 && index <= 5 ? [detour, point] : [point]);
    const report = validateRoute(verifierReference, candidate, 75);
    const lockedLine = report.checks.find((check) => check.id === 'segment-surface');
    expect(candidate).toHaveLength(12);
    expect(report.pass).toBe(false);
    expect(lockedLine).toMatchObject({ pass: false, label: 'Locked line 1 → 2' });
    expect(lockedLine?.detail).toMatch(/two-way line check/);
  });

  it('fails a geometry with fewer than two points', () => {
    expect(validateRoute(reference, [reference.track[0]], 75).pass).toBe(false);
  });
});
