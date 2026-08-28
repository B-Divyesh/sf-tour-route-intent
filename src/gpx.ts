import type { IntentKind, RouteDocument, RouteIntent, TrackPoint } from './types';

const decodeXml = (value: string): string => value
  .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"')
  .replaceAll('&apos;', "'").replaceAll('&amp;', '&');

const encodeXml = (value: string): string => value
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&apos;');

function tag(block: string, name: string): string | undefined {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return match ? decodeXml(match[1].trim()) : undefined;
}

function parsePointBlock(attributes: string, body: string): TrackPoint | undefined {
  const lat = Number(attributes.match(/\blat=["']([^"']+)["']/i)?.[1]);
  const lon = Number(attributes.match(/\blon=["']([^"']+)["']/i)?.[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return undefined;
  const eleText = tag(body, 'ele');
  const ele = eleText === undefined ? undefined : Number(eleText);
  return { lat, lon, ...(Number.isFinite(ele) ? { ele } : {}) };
}

export function parseGpx(xml: string): RouteDocument {
  if (!/<gpx\b/i.test(xml)) throw new Error('This does not look like a GPX file. Choose a .gpx file exported by a route or navigation app.');
  // GPX 1.1 permits empty point elements (`<trkpt .../>`) as well as points
  // containing children such as elevation. Accept both serializations.
  const pointPattern = /<(trkpt|rtept)\b([^>]*?)(?:\/\s*>|>([\s\S]*?)<\/\1\s*>)/gi;
  const track: TrackPoint[] = [];
  for (const match of xml.matchAll(pointPattern)) {
    const point = parsePointBlock(match[2], match[3] ?? '');
    if (point) track.push(point);
  }
  if (track.length < 2) throw new Error('No usable route line was found. The GPX needs at least two trkpt or rtept points.');

  const name = tag(xml.match(/<(trk|rte)\b[^>]*>([\s\S]*?)<\/\1>/i)?.[2] ?? '', 'name') || 'Imported tour';
  const intents: RouteIntent[] = [];
  const waypointPattern = /<wpt\b([^>]*)>([\s\S]*?)<\/wpt>/gi;
  for (const match of xml.matchAll(waypointPattern)) {
    if (!/<(?:tri:)?trackIndex>/i.test(match[2])) continue;
    const index = Number(tag(match[2].replaceAll('tri:', ''), 'trackIndex'));
    if (!Number.isInteger(index) || index < 0 || index >= track.length) continue;
    const rawKind = tag(match[2].replaceAll('tri:', ''), 'kind') ?? 'other';
    const kinds: IntentKind[] = ['surface', 'water', 'ferry', 'avoid-night', 'other'];
    intents.push({
      id: tag(match[2].replaceAll('tri:', ''), 'id') || crypto.randomUUID(),
      trackIndex: index,
      kind: kinds.includes(rawKind as IntentKind) ? rawKind as IntentKind : 'other',
      note: tag(match[2], 'desc') ?? '',
      lockPoint: tag(match[2].replaceAll('tri:', ''), 'lockPoint') !== 'false',
      lockToNext: tag(match[2].replaceAll('tri:', ''), 'lockToNext') === 'true',
    });
  }
  return { name, track, intents };
}

export function exportGpx(route: RouteDocument): string {
  const time = new Date().toISOString();
  const waypoints = [...route.intents].sort((a, b) => a.trackIndex - b.trackIndex).map((intent, index) => {
    const point = route.track[intent.trackIndex];
    if (!point) return '';
    return `  <wpt lat="${point.lat.toFixed(7)}" lon="${point.lon.toFixed(7)}">
    <name>Intent ${index + 1}: ${encodeXml(intent.kind)}</name>
    <desc>${encodeXml(intent.note)}</desc>
    <sym>Flag, Blue</sym>
    <type>Tour route intent</type>
    <extensions><tri:id>${encodeXml(intent.id)}</tri:id><tri:trackIndex>${intent.trackIndex}</tri:trackIndex><tri:kind>${intent.kind}</tri:kind><tri:lockPoint>${intent.lockPoint}</tri:lockPoint><tri:lockToNext>${intent.lockToNext}</tri:lockToNext></extensions>
  </wpt>`;
  }).join('\n');
  const points = route.track.map((point) => `      <trkpt lat="${point.lat.toFixed(7)}" lon="${point.lon.toFixed(7)}">${point.ele === undefined ? '' : `<ele>${point.ele}</ele>`}</trkpt>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Tour Route Intent" xmlns="http://www.topografix.com/GPX/1/1" xmlns:tri="https://tour-route-intent.sociobot.in/schema/1">
  <metadata><name>${encodeXml(route.name)}</name><time>${time}</time></metadata>
${waypoints}
  <trk><name>${encodeXml(route.name)}</name><type>Cycling</type><trkseg>
${points}
  </trkseg></trk>
</gpx>`;
}
