import { Component, memo, useEffect, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import MapView, { Marker, type Region } from 'react-native-maps';
import type { Coordinates, Restroom } from '../types';
import { colors, fonts } from '../../../theme/tokens';

export type RestroomMapProps = {
  deviceLocation?: Coordinates | null;
  fullScreen?: boolean;
  center: Coordinates | null;
  radiusKm: number;
  restrooms: Restroom[];
  selectedId?: string;
  markerLabels?: Record<string, string>;
  onSelect(id: string): void;
  onSearchArea(center: Coordinates): void;
  onShowList(): void;
  providerAvailable?: boolean;
};

function bounded(center: Coordinates): Coordinates {
  return {
    latitude: Math.max(-85, Math.min(85, center.latitude)),
    longitude: ((center.longitude + 540) % 360) - 180,
  };
}
function regionFor(center: Coordinates, radiusKm: number): Region {
  const point = bounded(center);
  const latitudeDelta = Math.max(
    0.005,
    Math.min(0.2, (Math.max(1, Math.min(5, radiusKm)) * 2.6) / 111),
  );
  return {
    ...point,
    latitudeDelta,
    longitudeDelta: Math.min(
      1,
      latitudeDelta / Math.max(0.1, Math.cos((point.latitude * Math.PI) / 180)),
    ),
  };
}

function Action({ label, onPress }: { label: string; onPress(): void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.action}
    >
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}
function Fallback({ onShowList }: Pick<RestroomMapProps, 'onShowList'>) {
  return (
    <View style={styles.fallback}>
      <Text accessibilityRole="alert" style={styles.text}>
        Map unavailable. You can still choose a search area and find restrooms
        in the list.
      </Text>
      <Action label="Show restroom list" onPress={onShowList} />
    </View>
  );
}
class MapBoundary extends Component<
  { children: ReactNode; onShowList(): void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <Fallback onShowList={this.props.onShowList} />
    ) : (
      this.props.children
    );
  }
}

/** Keeps viewport gestures local until the seeker explicitly applies Search this area. */
export const RestroomMap = memo(function RestroomMap(props: RestroomMapProps) {
  return (
    <MapSurface
      key={`${props.center?.latitude}:${props.center?.longitude}:${props.radiusKm}`}
      {...props}
    />
  );
});

function MapSurface(props: RestroomMapProps) {
  const {
    center,
    radiusKm,
    restrooms,
    selectedId,
    markerLabels,
    onSelect,
    onSearchArea,
    onShowList,
  } = props;
  const [region, setRegion] = useState<Region>(() =>
    center
      ? regionFor(center, radiusKm)
      : {
          latitude: 0,
          longitude: 0,
          latitudeDelta: 120,
          longitudeDelta: 180,
        },
  );
  const [pending, setPending] = useState<Coordinates | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const providerAvailable =
    props.providerAvailable ??
    (Platform.OS === 'ios' ||
      (Platform.OS === 'android' &&
        (Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
          Boolean(Constants.expoConfig?.extra?.androidMapsConfigured))));
  useEffect(() => {
    if (!providerAvailable || ready) return;
    const timer = setTimeout(() => setFailed(true), 18000);
    return () => clearTimeout(timer);
  }, [providerAvailable, ready]);
  if (!providerAvailable || failed) return <Fallback onShowList={onShowList} />;
  return (
    <MapBoundary onShowList={onShowList}>
      <View style={[styles.container, props.fullScreen && styles.fullScreen]}>
        <MapView
          style={[styles.map, props.fullScreen && styles.fullScreen]}
          region={region}
          onMapReady={() => setReady(true)}
          showsUserLocation={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
          onRegionChangeComplete={(next) => {
            setRegion(next);
            const point = bounded(next);
            setPending(
              !center ||
                Math.abs(point.latitude - center.latitude) +
                  Math.abs(point.longitude - center.longitude) >
                  0.0001
                ? point
                : null,
            );
          }}
        >
          {props.deviceLocation && (
            <Marker
              coordinate={props.deviceLocation}
              title="Your captured location"
              description="Last captured when you tapped Use my location. Tap it again to update."
              pinColor={colors.primary}
            />
          )}
          {restrooms.map((restroom, index) => (
            <Marker
              key={restroom.id}
              coordinate={restroom.entrance}
              title={`${selectedId === restroom.id ? 'Selected: ' : ''}${restroom.name}`}
              description={markerLabels?.[restroom.id] ?? restroom.floor}
              onPress={() => onSelect(restroom.id)}
            >
              <View
                style={[
                  styles.marker,
                  selectedId === restroom.id && styles.selected,
                ]}
              >
                <Text
                  style={[
                    styles.markerText,
                    selectedId === restroom.id && styles.selectedText,
                  ]}
                >
                  {selectedId === restroom.id ? '✓ ' : ''}
                  {index + 1}
                </Text>
              </View>
            </Marker>
          ))}
        </MapView>
        <View style={styles.controls}>
          {pending && (
            <Action
              label="Search this area"
              onPress={() => {
                onSearchArea(pending);
                setPending(null);
              }}
            />
          )}
          <Action label="Show restroom list" onPress={onShowList} />
        </View>
        <Action label="Map not loading? Use list" onPress={onShowList} />
      </View>
    </MapBoundary>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: 300, flex: 1 },
  map: { flex: 1, minHeight: 260 },
  fullScreen: { flex: 1, minHeight: 0 },
  controls: {
    position: 'absolute',
    bottom: 24,
    left: 12,
    right: 12,
    alignItems: 'center',
    gap: 8,
  },
  action: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  text: { color: colors.ink, fontFamily: fonts.body, fontSize: 16 },
  fallback: {
    minHeight: 200,
    padding: 24,
    gap: 16,
    justifyContent: 'center',
    backgroundColor: colors.subtle,
  },
  marker: {
    minWidth: 48,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  selected: { borderRadius: 8, backgroundColor: colors.primary },
  markerText: { color: colors.primary, fontFamily: fonts.bold },
  selectedText: { color: colors.inverse },
});
