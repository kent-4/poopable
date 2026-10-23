import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AmenityChip,
  AppText,
  Button,
  Card,
  ScoreCard,
  SegmentedDock,
} from '../../components/ui';
import { colors, fonts } from '../../theme/tokens';
import { useRestroomExperience, useRestroomScope } from './context';
import { HistorySection } from './HistorySection';
import { AreaPicker } from './AreaPicker';
import { normalizedLocationQuery } from './search-area';
import {
  assessment,
  discover,
  distanceKm,
  emptyFilters,
  openingText,
  usabilityText,
  type DiscoveryResult,
} from './model';
import type {
  ContributionTarget,
  Coordinates,
  Filters,
  Restroom,
} from './types';

export type MapAdapterProps = {
  deviceLocation?: Coordinates | null;
  fullScreen?: boolean;
  center: Coordinates | null;
  radiusKm: number;
  restrooms: Restroom[];
  selectedId?: string;
  onSelect(id: string): void;
  onSearchArea(center: Coordinates): void;
  onShowList(): void;
  markerLabels?: Record<string, string>;
};

export function DirectionsAction({ restroom }: { restroom: Restroom }) {
  const { dependencies } = useRestroomExperience();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  async function open() {
    setBusy(true);
    setError(null);
    try {
      await dependencies.directions.open(restroom);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Directions are unavailable.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={styles.stack}>
      <Button label="Directions" disabled={busy} onPress={() => void open()} />
      {error && (
        <View style={styles.stack}>
          <AppText accessibilityRole="alert">{error}</AppText>
          <AppText
            selectable
          >{`${restroom.address}\nEntrance: ${restroom.entrance.latitude}, ${restroom.entrance.longitude}\n${restroom.floor}`}</AppText>
          <Button
            label="Copy destination"
            variant="secondary"
            onPress={() => {
              void dependencies.directions
                .copy(restroom)
                .then(() => setCopied(true))
                .catch(() =>
                  setError(
                    'Could not copy. Select the destination text above to copy it.',
                  ),
                );
            }}
          />
          {copied && (
            <AppText accessibilityLiveRegion="polite">
              Destination copied
            </AppText>
          )}
        </View>
      )}
    </View>
  );
}

function Rating({ info }: { info: ReturnType<typeof assessment> }) {
  return (
    <AppText>
      {info.overall.value === null
        ? 'No ratings yet'
        : `${info.overall.value.toFixed(1)} / 5 · ${info.overall.count} reviews`}
    </AppText>
  );
}
function ResultCard({
  row,
  onOpen,
  compact = false,
}: {
  compact?: boolean;
  row: DiscoveryResult;
  onOpen: (id: string) => void;
}) {
  const { restroom, assessment: info, distance } = row;
  return (
    <Card style={compact ? { gap: 6, padding: 12 } : undefined}>
      <AppText variant={compact ? 'heading' : 'subtitle'}>
        {restroom.name}
      </AppText>
      <AppText>{restroom.floor}</AppText>
      <AppText>{`${distance.toFixed(2)} km direct distance · ${accessText(restroom)}`}</AppText>
      <Rating info={info} />
      <AppText>{openingText(info.opening)}</AppText>
      <AppText>{usabilityText(info.recent)}</AppText>
      <AppText>
        {info.eligible
          ? 'Recommended for your search'
          : 'Not recommended for this search'}
      </AppText>
      {info.desperate.classified && (
        <AppText>{`Desperate-times option · ${info.desperate.flagged} of ${info.desperate.total} recent answers`}</AppText>
      )}
      {info.desperate.pending && <AppText>Assessment needs refresh</AppText>}
      <Button
        label={`Details for ${restroom.name}`}
        onPress={() => onOpen(restroom.id)}
      />
      <DirectionsAction restroom={restroom} />
    </Card>
  );
}
function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <AppText style={styles.flex}>{label}</AppText>
      <Switch
        accessibilityLabel={label}
        accessibilityState={{ checked: value }}
        value={value}
        onValueChange={onChange}
      />
    </View>
  );
}
function FiltersPanel({
  value,
  onChange,
  onApply,
  onCancel,
}: {
  value: Filters;
  onChange: (filters: Filters) => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  return (
    <Card>
      <AppText variant="subtitle">Search requirements</AppText>
      {(
        [
          ['wheelchair', 'Require wheelchair access'],
          ['bidet', 'Require bidet'],
          ['babyChanging', 'Require baby-changing facilities'],
          ['free', 'Require free entry'],
        ] as const
      ).map(([key, label]) => (
        <Toggle
          key={key}
          label={label}
          value={value[key]}
          onChange={(checked) => onChange({ ...value, [key]: checked })}
        />
      ))}
      <AppText>
        Required attributes must be known. Unknown values do not match.
      </AppText>
      <AppText variant="heading">Gender designation</AppText>
      <View style={styles.row}>
        {(['any', 'men', 'women', 'all-gender'] as const).map((gender) => (
          <Button
            key={gender}
            label={`Gender ${gender}`}
            selected={value.gender === gender}
            variant={value.gender === gender ? 'primary' : 'secondary'}
            onPress={() => onChange({ ...value, gender })}
          />
        ))}
      </View>
      <AppText variant="heading">Minimum overall score</AppText>
      <View style={styles.row}>
        <Button
          label="No minimum score"
          selected={value.minimumScore === null}
          variant={value.minimumScore === null ? 'primary' : 'secondary'}
          onPress={() => onChange({ ...value, minimumScore: null })}
        />
        {[1, 2, 3, 4, 5].map((minimumScore) => (
          <Button
            key={minimumScore}
            label={`Minimum score ${minimumScore}`}
            selected={value.minimumScore === minimumScore}
            variant={
              value.minimumScore === minimumScore ? 'primary' : 'secondary'
            }
            onPress={() => onChange({ ...value, minimumScore })}
          />
        ))}
      </View>
      <Toggle
        label="Include desperate-times options"
        value={value.includeDesperate}
        onChange={(includeDesperate) =>
          onChange({ ...value, includeDesperate })
        }
      />
      <AppText>
        Includes last-resort quality assessments without changing access,
        minimum score, or usability requirements. Low ratings alone do not
        create this label.
      </AppText>
      <Button label="Apply filters" onPress={onApply} />
      <Button
        label="Reset filters"
        variant="secondary"
        onPress={() => onChange({ ...emptyFilters })}
      />
      <Button label="Cancel filters" variant="secondary" onPress={onCancel} />
    </Card>
  );
}

export function DiscoveryScreen({
  onOpen,
  onAccount,
  MapComponent,
}: {
  onOpen: (id: string) => void;
  onAccount: () => void;
  MapComponent?: React.ComponentType<MapAdapterProps>;
}) {
  const {
    deviceLocation,
    setDeviceLocation,
    snapshot,
    search,
    setSearch,
    now,
    refreshing,
    error,
    lastRefreshed,
    refresh,
    dependencies,
  } = useRestroomExperience();
  const [filters, setFilters] = useState<Filters | null>(null);
  const panelTitleRef = useRef<React.ComponentRef<typeof View>>(null);
  const [mode, setMode] = useState(MapComponent ? 'Map' : 'List');
  const [selectedId, setSelectedId] = useState<string>();
  const [choosingArea, setChoosingArea] = useState(!search.center);
  const searchFieldRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const panelOpen = filters !== null || (mode === 'Map' && choosingArea);
  useEffect(() => {
    if (panelOpen) return;
    const frame = requestAnimationFrame(() => {
      if (searchFieldRef.current)
        AccessibilityInfo.sendAccessibilityEvent(
          searchFieldRef.current,
          'focus',
        );
    });
    return () => cancelAnimationFrame(frame);
  }, [panelOpen]);
  const [areaLabel, setAreaLabel] = useState('Search area selected');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const locationRequest = useRef(0);
  useEffect(
    () => () => {
      locationRequest.current++;
    },
    [],
  );
  function chooseCenter(center: Coordinates, label = 'Map area selected') {
    locationRequest.current++;
    setLocating(false);
    setSearch((previous) => ({ ...previous, center }));
    setAreaLabel(label);
    setLocationError(null);
    setChoosingArea(false);
  }
  const rows = discover(snapshot, search, now);
  const selected =
    rows.find((row) => row.restroom.id === selectedId) ?? rows[0];
  async function locate() {
    const request = ++locationRequest.current;
    setLocating(true);
    setLocationError(null);
    try {
      const center = await dependencies.location.locate();
      if (request !== locationRequest.current) return;
      setDeviceLocation(center);
      chooseCenter(center, 'Current location');
    } catch (error) {
      if (request !== locationRequest.current) return;
      setLocationError(
        error instanceof Error
          ? error.message
          : 'Location is unavailable. Choose a search area or try again.',
      );
      setChoosingArea(true);
    } finally {
      if (request === locationRequest.current) setLocating(false);
    }
  }
  const brand = (
    <View style={styles.row}>
      <View style={styles.flex}>
        <AppText variant="title">Poopable</AppText>
        <AppText>Find a restroom for your search</AppText>
      </View>
      <Button label="Account" variant="secondary" onPress={onAccount} />
    </View>
  );
  const header = (
    <View style={styles.stack}>
      {dependencies.mode === 'demo' && (
        <AppText accessibilityRole="alert">
          Fictional demo catalog · not real facilities or visitor advice
        </AppText>
      )}
      {dependencies.mode === 'unconfigured' && (
        <Card>
          <AppText variant="subtitle">Catalog setup required</AppText>
          <AppText>
            No live catalog is configured. Ask the owner to connect an approved
            development service, or start with EXPO_PUBLIC_DATA_MODE=demo for
            fictional examples.
          </AppText>
          <Button label="Retry setup" onPress={() => void refresh()} />
        </Card>
      )}
      <TextInput
        ref={searchFieldRef}
        accessibilityLabel="Search catalog names and addresses"
        placeholder="Search names or addresses"
        value={search.query}
        onChangeText={(query) => setSearch({ ...search, query })}
        style={styles.input}
        returnKeyType="search"
      />
      {mode === 'List' && (choosingArea || search.query.trim()) && (
        <AreaPicker
          key={normalizedLocationQuery(search.query)}
          query={normalizedLocationQuery(search.query)}
          onSelect={(restroom) =>
            chooseCenter(restroom.entrance, `Area around ${restroom.name}`)
          }
        />
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRail}
        keyboardShouldPersistTaps="handled"
      >
        <Button
          label="Use my location"
          disabled={locating}
          variant="secondary"
          onPress={() => void locate()}
        />
        <Button
          label="Choose search area"
          variant="secondary"
          onPress={() => setChoosingArea(!choosingArea)}
        />

        {([1, 2, 5] as const).map((radiusKm) => (
          <Button
            key={radiusKm}
            label={`${radiusKm} km radius`}
            selected={search.radiusKm === radiusKm}
            variant={search.radiusKm === radiusKm ? 'primary' : 'secondary'}
            onPress={() => setSearch({ ...search, radiusKm })}
          />
        ))}

        <Button
          label="Filters"
          variant="secondary"
          onPress={() => setFilters({ ...search.filters })}
        />
        {(
          [
            ['bidet', 'Bidet'],
            ['free', 'Free entry'],
            ['wheelchair', 'Wheelchair access'],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            label={label}
            selected={search.filters[key]}
            variant={search.filters[key] ? 'primary' : 'secondary'}
            onPress={() =>
              setSearch({
                ...search,
                filters: { ...search.filters, [key]: !search.filters[key] },
              })
            }
          />
        ))}
      </ScrollView>
      {locating && (
        <AppText accessibilityLiveRegion="polite">
          Finding your location…
        </AppText>
      )}
      {locationError && (
        <AppText accessibilityRole="alert">{locationError}</AppText>
      )}
      {search.center && <AppText>{areaLabel}</AppText>}

      {refreshing && (
        <AppText accessibilityLiveRegion="polite">
          {lastRefreshed ? 'Refreshing restrooms…' : 'Loading restrooms…'}
        </AppText>
      )}
      {error && (
        <Card>
          <AppText accessibilityRole="alert">{error}</AppText>
          {lastRefreshed !== null && (
            <AppText>{`Showing stale data · last refreshed ${new Date(lastRefreshed).toLocaleString()}. This does not confirm current usability.`}</AppText>
          )}
          <Button label="Retry" onPress={() => void refresh()} />
        </Card>
      )}
      {!error && lastRefreshed !== null && (
        <Button
          label="Refresh restrooms"
          variant="secondary"
          onPress={() => void refresh()}
        />
      )}
      <AppText>{`${rows.length} matching restrooms · ${search.radiusKm} km radius`}</AppText>
      {rows.length > 0 && !rows.some((row) => row.assessment.eligible) && (
        <AppText>
          No recommendations for this search. Discovered matches remain
          available with their conditions.
        </AppText>
      )}
    </View>
  );
  return (
    <SafeAreaView style={styles.page}>
      {mode === 'Map' ? (
        <>
          <View style={styles.brandHeader}>{brand}</View>
          <View style={styles.mapStage}>
            {MapComponent ? (
              <MapComponent
                fullScreen
                deviceLocation={deviceLocation}
                center={search.center}
                radiusKm={search.radiusKm}
                restrooms={rows.map((row) => row.restroom)}
                selectedId={selected?.restroom.id}
                onSelect={setSelectedId}
                onSearchArea={chooseCenter}
                onShowList={() => setMode('List')}
                markerLabels={Object.fromEntries(
                  rows.map((row) => [
                    row.restroom.id,
                    `${row.restroom.name}. ${openingText(row.assessment.opening)}. ${usabilityText(row.assessment.recent)}`,
                  ]),
                )}
              />
            ) : (
              <View style={styles.mapFallback}>
                <AppText>
                  Map unavailable. The complete list is available.
                </AppText>
                <Button label="Show list" onPress={() => setMode('List')} />
              </View>
            )}
            <View style={styles.floatingSearch}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.floatingContent}
              >
                {header}
              </ScrollView>
            </View>
          </View>
          {selected ? (
            <ScrollView
              style={styles.selectedSummary}
              contentContainerStyle={styles.summaryContent}
            >
              <ResultCard row={selected} onOpen={onOpen} compact />
            </ScrollView>
          ) : (
            <View style={styles.summaryContent}>
              <AppText>
                {search.center
                  ? 'No matching restrooms. Expand the radius, choose another location, or reset filters.'
                  : 'Choose a search location'}
              </AppText>
              <Button
                label="Reset search filters"
                variant="secondary"
                onPress={() =>
                  setSearch({
                    ...search,
                    query: '',
                    filters: { ...emptyFilters },
                  })
                }
              />
            </View>
          )}
        </>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(row) => row.restroom.id}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.stack}>
              {brand}
              {header}
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          ListEmptyComponent={
            !refreshing && rows.length === 0 ? (
              <Card>
                <AppText variant="subtitle">
                  {search.center
                    ? 'No matching restrooms'
                    : 'Choose a search location'}
                </AppText>
                <AppText>
                  Expand the radius, choose another location, or reset filters.
                  Desperate-times inclusion keeps your other requirements.
                </AppText>
                <Button
                  label="Reset search filters"
                  variant="secondary"
                  onPress={() =>
                    setSearch({
                      ...search,
                      query: '',
                      filters: { ...emptyFilters },
                    })
                  }
                />
              </Card>
            ) : undefined
          }
          renderItem={({ item }) => <ResultCard row={item} onOpen={onOpen} />}
        />
      )}
      <View style={styles.dockFooter}>
        <SegmentedDock
          items={['Map', 'List', 'Account']}
          selected={mode}
          onSelect={(item) =>
            item === 'Account' ? onAccount() : setMode(item)
          }
        />
      </View>
      <Modal
        visible={panelOpen}
        animationType="none"
        onRequestClose={() => {
          setFilters(null);
          setChoosingArea(false);
        }}
        onShow={() => {
          if (panelTitleRef.current)
            AccessibilityInfo.sendAccessibilityEvent(
              panelTitleRef.current,
              'focus',
            );
        }}
      >
        <SafeAreaView style={styles.page}>
          <KeyboardAvoidingView
            style={styles.page}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}
            >
              <View ref={panelTitleRef} accessible accessibilityRole="header">
                <AppText variant="title">
                  {filters ? 'Search requirements' : 'Choose search area'}
                </AppText>
              </View>
              {filters ? (
                <FiltersPanel
                  value={filters}
                  onChange={setFilters}
                  onApply={() => {
                    setSearch({ ...search, filters });
                    setFilters(null);
                  }}
                  onCancel={() => setFilters(null)}
                />
              ) : (
                <>
                  <TextInput
                    accessibilityLabel="Search catalog names and addresses"
                    placeholder="Search names or addresses"
                    value={search.query}
                    onChangeText={(query) => setSearch({ ...search, query })}
                    style={styles.input}
                  />
                  <AreaPicker
                    key={normalizedLocationQuery(search.query)}
                    query={normalizedLocationQuery(search.query)}
                    onSelect={(restroom) => {
                      chooseCenter(
                        restroom.entrance,
                        `Area around ${restroom.name}`,
                      );
                      setSearch((previous) => ({ ...previous, query: '' }));
                    }}
                  />
                  <Button
                    label="Back to map"
                    variant="secondary"
                    onPress={() => {
                      setChoosingArea(false);
                      setSearch({ ...search, query: '' });
                    }}
                  />
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

export function DetailScreen({
  restroomId,
  onBack,
  onContribute,
  MapComponent,
  FlagComponent,
}: {
  restroomId: string;
  onBack: () => void;
  onContribute: (target: ContributionTarget) => void;
  MapComponent?: React.ComponentType<MapAdapterProps>;
  FlagComponent?: React.ComponentType<{
    kind: 'review' | 'report';
    contributionId: string;
  }>;
}) {
  useRestroomScope(restroomId);
  const {
    snapshot,
    now,
    search,
    refreshing,
    error,
    refresh,
    visitor,
    lastRefreshed,
    setSearch,
  } = useRestroomExperience();
  const restroom = snapshot.restrooms.find(
    (r) => r.id === restroomId && r.state !== 'pending',
  );
  if (!restroom)
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.content}>
          <AppText variant="title">
            {refreshing ? 'Loading restroom…' : 'Restroom not found'}
          </AppText>
          {error && <AppText accessibilityRole="alert">{error}</AppText>}
          <Button label="Retry detail" onPress={() => void refresh()} />
          <Button label="Back to search" onPress={onBack} />
        </View>
      </SafeAreaView>
    );
  const info = assessment(snapshot, restroom, now);
  const recommended =
    info.eligible &&
    discover(snapshot, search, now).some(
      (row) => row.restroom.id === restroom.id,
    );
  const ownReview = info.reviews.find(
    (review) => review.authorId === visitor?.id,
  );
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        {error && (
          <Card>
            <AppText accessibilityRole="alert">{error}</AppText>
            <AppText>{`Showing stale data · last refreshed ${lastRefreshed === null ? 'unknown' : new Date(lastRefreshed).toLocaleString()}. This does not confirm current usability.`}</AppText>
            <Button label="Retry detail" onPress={() => void refresh()} />
          </Card>
        )}
        {!error && (
          <Button
            label="Refresh detail"
            variant="secondary"
            disabled={refreshing}
            onPress={() => void refresh()}
          />
        )}
        <Button label="Back to search" variant="secondary" onPress={onBack} />
        {restroom.fictional && (
          <AppText>Fictional demo restroom · not a real destination</AppText>
        )}
        <AppText variant="title">{restroom.name}</AppText>
        {MapComponent && (
          <MapComponent
            center={restroom.entrance}
            radiusKm={1}
            restrooms={[restroom]}
            selectedId={restroom.id}
            onSelect={() => {}}
            onSearchArea={(center) => {
              setSearch({ ...search, center });
              onBack();
            }}
            onShowList={onBack}
          />
        )}
        {restroom.state === 'permanently-closed' && (
          <AppText accessibilityRole="alert">
            Permanently closed · retained history, excluded from discovery
          </AppText>
        )}
        <AppText>{`${restroom.building} · ${restroom.floor}`}</AppText>
        <AppText selectable>{restroom.address}</AppText>
        {search.center && (
          <AppText>{`${distanceKm(search.center, restroom.entrance).toFixed(2)} km direct distance`}</AppText>
        )}
        <Card>
          <AppText>{accessText(restroom)}</AppText>
          {restroom.access.notes && <AppText>{restroom.access.notes}</AppText>}
          <AppText>{openingText(info.opening)}</AppText>
          <AppText>
            {recommended
              ? 'Recommended for your search'
              : 'Not recommended for this search'}
          </AppText>
          <AppText>{usabilityText(info.recent)}</AppText>
          {info.recent && FlagComponent && (
            <FlagComponent kind="report" contributionId={info.recent.id} />
          )}
          <AppText>
            Visitor observations are not a guarantee of current access.
          </AppText>
          {restroom.hours ? (
            <View style={styles.stack}>
              <AppText variant="heading">{`Opening hours · ${restroom.timezone}`}</AppText>
              {restroom.hours.length === 0 ? (
                <AppText>No opening periods</AppText>
              ) : (
                restroom.hours.map((period, index) => (
                  <AppText
                    key={index}
                  >{`${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][period.day] ?? 'Unknown day'} ${period.opens}–${period.closes}`}</AppText>
                ))
              )}
            </View>
          ) : (
            <AppText>Opening schedule not supplied</AppText>
          )}
        </Card>
        <View style={styles.row}>
          {(
            [
              ['bidet', 'Bidet'],
              ['wheelchair', 'Wheelchair access'],
              ['babyChanging', 'Baby changing'],
            ] as const
          ).map(([key, label]) => (
            <AmenityChip
              key={key}
              label={label}
              status={
                restroom.attributes[key] === 'yes'
                  ? 'available'
                  : restroom.attributes[key] === 'no'
                    ? 'missing'
                    : 'unknown'
              }
            />
          ))}
          <AmenityChip
            label={`Gender: ${restroom.attributes.gender}`}
            status={
              restroom.attributes.gender === 'unknown' ? 'unknown' : 'available'
            }
          />
        </View>
        <Card>
          <AppText variant="subtitle">Visitor experience</AppText>
          <Rating info={info} />
          {(['cleanliness', 'supplies', 'facilityCondition'] as const).map(
            (key) => (
              <View key={key}>
                <ScoreCard
                  label={
                    key === 'facilityCondition'
                      ? 'Facility condition'
                      : key === 'cleanliness'
                        ? 'Cleanliness'
                        : 'Supplies'
                  }
                  value={info[key].value}
                />
                <AppText>{`${info[key].count} dimension ratings`}</AppText>
              </View>
            ),
          )}
          <AppText>
            {info.desperate.pending
              ? 'Assessment needs refresh'
              : info.desperate.classified
                ? 'Desperate-times option'
                : 'Insufficient evidence for a desperate-times classification'}
          </AppText>
          {info.desperate.pending ? (
            <AppText>
              Recent assessment counts are unavailable until refreshed.
            </AppText>
          ) : (
            <AppText>{`${info.desperate.flagged} flagged of ${info.desperate.total} explicit answers in the past 30 days`}</AppText>
          )}
          {!info.desperate.pending && info.desperate.latestAt !== null && (
            <AppText>{`Latest assessment ${new Date(info.desperate.latestAt).toLocaleString()}`}</AppText>
          )}
          <AppText>
            At least three recent answers and a strict majority are required.
            This assessment is separate from stars and usability.
          </AppText>
        </Card>
        <Button
          label={ownReview ? 'Edit Review' : 'Write Review'}
          onPress={() => onContribute({ restroomId, action: 'review' })}
        />
        <Button
          label="Report Usability"
          variant="secondary"
          onPress={() => onContribute({ restroomId, action: 'report' })}
        />
        <HistorySection
          restroomId={restroomId}
          recentReportId={info.recent?.id}
          FlagComponent={FlagComponent}
        />
      </ScrollView>
      <View style={styles.footer}>
        <DirectionsAction restroom={restroom} />
      </View>
    </SafeAreaView>
  );
}
function accessText(restroom: Restroom) {
  return `${restroom.access.fee === 'free' ? 'Free entry' : restroom.access.fee === 'paid' ? 'Paid entry' : 'Entry fee unknown'} · ${restroom.access.customerOnly === true ? 'Customers only' : restroom.access.customerOnly === false ? 'No customer-only restriction' : 'Customer restriction unknown'}`;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.page },
  brandHeader: { paddingHorizontal: 16, paddingVertical: 8 },
  mapStage: { flex: 1, minHeight: 0 },
  mapFallback: { flex: 1, justifyContent: 'flex-end', padding: 20, gap: 12 },
  floatingSearch: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    maxHeight: '48%',
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  floatingContent: { padding: 12 },
  chipRail: { gap: 8, alignItems: 'center', paddingVertical: 4 },
  selectedSummary: { maxHeight: '32%', flexGrow: 0 },
  summaryContent: { padding: 12, gap: 8 },
  dockFooter: { paddingHorizontal: 12, paddingVertical: 8 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  footer: { paddingHorizontal: 20, paddingVertical: 12 },
  stack: { gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  flex: { flex: 1, minWidth: 140 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    minHeight: 48,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
});
