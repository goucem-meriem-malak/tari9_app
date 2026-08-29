import { GeoPoint } from '@/types';

const EARTH_RADIUS_METERS = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine distance in meters between two lat/lng points.
 * Replaces the original app's per-screen use of Android's
 * Location.distanceTo() - same formula family, framework-independent,
 * and centralized instead of copy-pasted into six Activities.
 */
export function getDistanceMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  const distance = 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
  return Math.round(distance * 100) / 100;
}
