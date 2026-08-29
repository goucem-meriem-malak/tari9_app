import * as Location from 'expo-location';
import { Address, GeoPoint } from '@/types';

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation(): Promise<GeoPoint> {
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

/**
 * Reverse geocode via OpenStreetMap's free Nominatim API - no API key,
 * no billing account, replaces the original app's Android Geocoder call
 * (which itself was free, but this keeps geocoding consistent with the
 * rest of the free/OSM map stack instead of mixing providers).
 *
 * Nominatim's usage policy caps this at ~1 request/second, which is
 * fine for a user picking their own location once per request.
 */
export async function reverseGeocode(point: GeoPoint): Promise<Address> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${point.lat}&lon=${point.lng}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Tari9App/1.0' },
    });
    const data = await res.json();
    return {
      raw: data.display_name ?? '',
      city:
        data.address?.city ??
        data.address?.town ??
        data.address?.county ??
        undefined,
      country: data.address?.country ?? undefined,
    };
  } catch {
    return { raw: '' };
  }
}
