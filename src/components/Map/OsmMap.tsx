import React from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { StyleSheet, View } from 'react-native';
import { GeoPoint } from '@/types';

// No API key, no billing account, ever - raw OpenStreetMap raster tiles.
// Fine for a demo/portfolio project; swap the tile URL for a provider
// like MapTiler's free tier (still no card required) if this needs to
// handle real production traffic later, since OSM's own tile servers
// discourage heavy direct app usage.
const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster' as const, source: 'osm' }],
};

interface Props {
  center: GeoPoint;
  marker?: GeoPoint;
  onMapPress?: (point: GeoPoint) => void;
  zoomLevel?: number;
}

export default function OsmMap({ center, marker, onMapPress, zoomLevel = 14 }: Props) {
  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={JSON.stringify(OSM_STYLE)}
        onPress={(e) => {
          if (!onMapPress) return;
          const [lng, lat] = e.geometry.coordinates;
          onMapPress({ lat, lng });
        }}
      >
        <MapLibreGL.Camera
          centerCoordinate={[center.lng, center.lat]}
          zoomLevel={zoomLevel}
          animationMode="flyTo"
        />
        {marker && (
          <MapLibreGL.PointAnnotation
            id="selected-location"
            coordinate={[marker.lng, marker.lat]}
          >
            <View style={styles.pin} />
          </MapLibreGL.PointAnnotation>
        )}
      </MapLibreGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  pin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0E6046',
    borderWidth: 3,
    borderColor: '#fff',
  },
});
