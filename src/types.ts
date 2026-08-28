export type IntentKind = 'surface' | 'water' | 'ferry' | 'avoid-night' | 'other';

export interface TrackPoint {
  lat: number;
  lon: number;
  ele?: number;
}

export interface RouteIntent {
  id: string;
  trackIndex: number;
  kind: IntentKind;
  note: string;
  lockPoint: boolean;
  lockToNext: boolean;
}

export interface RouteDocument {
  name: string;
  track: TrackPoint[];
  intents: RouteIntent[];
}

export interface ValidationCheck {
  id: string;
  label: string;
  detail: string;
  pass: boolean;
}

export interface ValidationReport {
  pass: boolean;
  checks: ValidationCheck[];
  candidatePoints: number;
  toleranceMeters: number;
}
