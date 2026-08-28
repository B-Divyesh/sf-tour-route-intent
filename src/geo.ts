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

interface TrackPosition { distance: number; index: number; fraction: number; }

function distanceToTrack(point: TrackPoint, track: TrackPoint[]): TrackPosition {
  if (track.length === 1) return { distance: haversineMeters(point, track[0]), index: 0, fraction: 0 };
  let best = Number.POSITIVE_INFINITY;
  let index = 0;
  let fraction = 0;
  for (let i = 0; i < track.length - 1; i += 1) {
    const [ax, ay] = xy(track[i], point);
    const [bx, by] = xy(track[i + 1], point);
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    const candidateFraction = lengthSquared ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSquared)) : 0;
    const distance = Math.hypot(ax + candidateFraction * dx, ay + candidateFraction * dy);
    if (distance < best) {
      best = distance;
      index = i;
      fraction = candidateFraction;
    }
  }
  return { distance: best, index, fraction };
}

function interpolate(a: TrackPoint, b: TrackPoint, fraction: number): TrackPoint {
  return { lat: a.lat + (b.lat - a.lat) * fraction, lon: a.lon + (b.lon - a.lon) * fraction };
}

function candidateSpan(track: TrackPoint[], start: TrackPosition, end: TrackPosition): TrackPoint[] | null {
  if (start.index > end.index || (start.index === end.index && start.fraction > end.fraction)) return null;
  const points = [interpolate(track[start.index], track[start.index + 1], start.fraction)];
  for (let index = start.index + 1; index <= end.index; index += 1) points.push(track[index]);
  points.push(interpolate(track[end.index], track[end.index + 1], end.fraction));
  return points;
}

/** Include every vertex, plus regular samples that expose departures between sparse points. */
function sampleLine(points: TrackPoint[], spacingMeters: number, maxExtraSamples = 800): TrackPoint[] {
  const sampled = [...points];
  const lengths = points.slice(1).map((point, index) => haversineMeters(points[index], point));
  const wanted = lengths.reduce((total, length) => total + Math.max(0, Math.ceil(length / spacingMeters) - 1), 0);
  const scale = wanted > maxExtraSamples ? wanted / maxExtraSamples : 1;
  lengths.forEach((length, index) => {
    const divisions = Math.max(1, Math.ceil(length / (spacingMeters * scale)));
    for (let step = 1; step < divisions; step += 1) sampled.push(interpolate(points[index], points[index + 1], step / divisions));
  });
  return sampled;
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
      const original = reference.track.slice(from, to + 1);
      const candidateStart = distanceToTrack(original[0], candidate);
      const candidateEnd = distanceToTrack(original[original.length - 1], candidate);
      const returned = candidateSpan(candidate, candidateStart, candidateEnd);
      const spacing = Math.max(5, toleranceMeters / 3);
      const referenceSamples = sampleLine(original, spacing);
      const returnedSamples = returned ? sampleLine(returned, spacing) : [];
      const referenceMisses = referenceSamples.map((point) => distanceToTrack(point, candidate).distance);
      const returnedMisses = returnedSamples.map((point) => distanceToTrack(point, original).distance);
      const misses = [...referenceMisses, ...returnedMisses];
      const worst = misses.length ? Math.max(...misses) : Number.POSITIVE_INFINITY;
      const coverage = misses.filter((distance) => distance <= toleranceMeters).length / Math.max(1, misses.length);
      const followsLine = returned !== null && coverage === 1;
      checks.push({
        id: `segment-${intent.id}`,
        label: `Locked line ${i + 1} → ${i + 2}`,
        detail: followsLine
          ? `The original and returned lines stay inside the ${toleranceMeters} m corridor in both directions.`
          : returned === null
            ? 'The locked line endpoints appear in a different route order.'
            : `${Math.round(coverage * 100)}% of the two-way line check stays in the corridor; the widest departure is about ${Math.round(worst)} m.`,
        pass: followsLine,
      });
    }
  }

  if (!checks.length) {
    checks.push({ id: 'no-locks', label: 'No locks to validate', detail: 'Add and lock at least one intent marker first.', pass: false });
  }
  return { pass: checks.every((check) => check.pass), checks, candidatePoints: candidate.length, toleranceMeters };
}
