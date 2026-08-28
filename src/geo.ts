import type { RouteDocument, TrackPoint, ValidationCheck, ValidationReport } from './types';

const EARTH_RADIUS = 6_371_000;

export function haversineMeters(a: TrackPoint, b: TrackPoint): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const lat1 = a.lat * rad;
  const lat2 = b.lat * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.min(1, Math.sqrt(h)));
}

function xy(point: TrackPoint, origin: TrackPoint): [number, number] {
  const rad = Math.PI / 180;
  return [
    (point.lon - origin.lon) * rad * EARTH_RADIUS * Math.cos(origin.lat * rad),
    (point.lat - origin.lat) * rad * EARTH_RADIUS,
  ];
}

export function pointToSegmentMeters(point: TrackPoint, a: TrackPoint, b: TrackPoint): number {
  const [px, py] = xy(point, point);
  const [ax, ay] = xy(a, point);
  const [bx, by] = xy(b, point);
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function distanceToTrack(point: TrackPoint, track: TrackPoint[]): { distance: number; index: number } {
  if (track.length === 1) return { distance: haversineMeters(point, track[0]), index: 0 };
  let best = Number.POSITIVE_INFINITY;
  let index = 0;
  for (let i = 0; i < track.length - 1; i += 1) {
    const distance = pointToSegmentMeters(point, track[i], track[i + 1]);
    if (distance < best) {
      best = distance;
      index = i;
    }
  }
  return { distance: best, index };
}

function sample(points: TrackPoint[], maxSamples = 80): TrackPoint[] {
  if (points.length <= maxSamples) return points;
  const stride = (points.length - 1) / (maxSamples - 1);
  return Array.from({ length: maxSamples }, (_, index) => points[Math.round(index * stride)]);
}

export function routeDistance(track: TrackPoint[]): number {
  return track.slice(1).reduce((total, point, index) => total + haversineMeters(track[index], point), 0);
}

export function validateRoute(reference: RouteDocument, candidate: TrackPoint[], toleranceMeters = 75): ValidationReport {
  const checks: ValidationCheck[] = [];
  if (candidate.length < 2) {
    return {
      pass: false,
      candidatePoints: candidate.length,
      toleranceMeters,
      checks: [{ id: 'geometry', label: 'Candidate route geometry', detail: 'The file needs at least two track or route points.', pass: false }],
    };
  }

  const intents = [...reference.intents].sort((a, b) => a.trackIndex - b.trackIndex);
  let lastCandidateIndex = -1;
  for (let i = 0; i < intents.length; i += 1) {
    const intent = intents[i];
    const anchor = reference.track[intent.trackIndex];
    if (!anchor) continue;
    if (intent.lockPoint) {
      const nearest = distanceToTrack(anchor, candidate);
      const near = nearest.distance <= toleranceMeters;
      const ordered = nearest.index >= lastCandidateIndex;
      checks.push({
        id: `point-${intent.id}`,
        label: `Marker ${i + 1}: ${intent.note || intent.kind}`,
        detail: near
          ? ordered ? `Passes within ${Math.round(nearest.distance)} m in route order.` : 'The place is reached, but in a different order.'
          : `Misses the locked place by about ${Math.round(nearest.distance)} m.`,
        pass: near && ordered,
      });
      if (near) lastCandidateIndex = Math.max(lastCandidateIndex, nearest.index);
    }

    const next = intents[i + 1];
    if (intent.lockToNext && next) {
      const from = Math.min(intent.trackIndex, next.trackIndex);
      const to = Math.max(intent.trackIndex, next.trackIndex);
      const original = sample(reference.track.slice(from, to + 1));
      const misses = original.map((point) => distanceToTrack(point, candidate).distance);
      const worst = Math.max(...misses);
      const coverage = misses.filter((distance) => distance <= toleranceMeters).length / Math.max(1, misses.length);
      checks.push({
        id: `segment-${intent.id}`,
        label: `Locked line ${i + 1} → ${i + 2}`,
        detail: coverage === 1
          ? `All ${original.length} route samples stay inside the ${toleranceMeters} m corridor.`
          : `${Math.round(coverage * 100)}% stays in the corridor; the widest departure is about ${Math.round(worst)} m.`,
        pass: coverage === 1,
      });
    }
  }

  if (!checks.length) {
    checks.push({ id: 'no-locks', label: 'No locks to validate', detail: 'Add and lock at least one intent marker first.', pass: false });
  }
  return { pass: checks.every((check) => check.pass), checks, candidatePoints: candidate.length, toleranceMeters };
}
