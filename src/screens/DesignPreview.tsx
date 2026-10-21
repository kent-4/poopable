import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AmenityChip,
  AppText,
  Badge,
  Button,
  Card,
  IconButton,
  ScoreCard,
  SegmentedDock,
  SheetSurface,
  UrgentToggle,
} from '../components/ui';
import { colors, spacing } from '../theme/tokens';

export function DesignPreview() {
  const [urgent, setUrgent] = useState(false);
  const [selected, setSelected] = useState('Components');
  const [saved, setSaved] = useState(false);
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <AppText variant="caption">A LITTLE COMFORT, CLOSE BY</AppText>
              <AppText variant="title">Poopable</AppText>
            </View>
            <IconButton
              label={saved ? 'Unsave preview' : 'Save preview'}
              onPress={() => setSaved(!saved)}
            >
              <AppText style={{ color: colors.primary }}>
                {saved ? '♥' : '♡'}
              </AppText>
            </IconButton>
          </View>
          <AppText variant="subtitle">Find your moment of relief.</AppText>
          <AppText style={{ color: colors.secondary }}>
            Warm eucalyptus, friendly aqua, and a softer place to land.
          </AppText>
          <AppText variant="caption">
            Design system preview · all restroom details are examples.
          </AppText>
          <SegmentedDock
            items={['Components', 'Typography', 'Surfaces']}
            selected={selected}
            onSelect={setSelected}
          />
          {selected === 'Components' && (
            <>
              <Card>
                <AppText variant="caption">EXAMPLE RESTROOM</AppText>
                <AppText variant="subtitle">A cozy little stop</AppText>
                <Badge
                  tier="recommended"
                  title="Highly recommended"
                  subtitle="Visual tier example"
                />
                <View style={styles.wrap}>
                  <AmenityChip label="Soap" status="available" />
                  <AmenityChip label="Baby changing" />
                  <AmenityChip label="Hand dryer" status="missing" />
                </View>
                <ScoreCard label="Cleanliness" value={4.5} />
                <ScoreCard label="Supplies" value={null} />
                <Button
                  label={saved ? 'Saved to preview' : 'Save this example'}
                  onPress={() => setSaved(!saved)}
                />
                <Button
                  label="Reset preview"
                  variant="secondary"
                  onPress={() => {
                    setSaved(false);
                    setUrgent(false);
                  }}
                />
              </Card>
              <View style={styles.wrap}>
                <Badge tier="average" title="Passable" />
                <Badge tier="emergency" title="Desperate times only" />
              </View>
              <UrgentToggle value={urgent} onValueChange={setUrgent} />
              <Button
                label={urgent ? 'Urgent preview enabled' : 'Try urgent styling'}
                variant="urgent"
                onPress={() => setUrgent(!urgent)}
              />
            </>
          )}
          {selected === 'Typography' && (
            <Card>
              <AppText variant="title">A friendly heading</AppText>
              <AppText variant="subtitle">Quicksand for character</AppText>
              <AppText variant="heading">Little details matter</AppText>
              <AppText>
                Nunito keeps descriptions, reviews, and useful information
                comfortable to read.
              </AppText>
              <AppText variant="caption">
                Supporting details stay clear and concise.
              </AppText>
            </Card>
          )}
          {selected === 'Surfaces' && (
            <>
              <Card>
                <AppText variant="heading">A softer surface</AppText>
                <AppText>
                  Rounded cards, subtle borders, and gentle eucalyptus shadows.
                </AppText>
              </Card>
              <SheetSurface>
                <AppText variant="subtitle">Room for the details</AppText>
                <AppText>
                  This previews the sheet surface. It is a static container, not
                  an interactive bottom sheet.
                </AppText>
                <Button
                  label="Back to components"
                  onPress={() => setSelected('Components')}
                />
              </SheetSurface>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  scroll: { padding: spacing.xl, paddingBottom: 40 },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    gap: spacing.xl,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
