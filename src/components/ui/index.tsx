import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import {
  colors,
  fonts,
  radii,
  shadows,
  tiers,
  type Tier,
} from '../../theme/tokens';

export function AppText({
  variant = 'body',
  style,
  ...props
}: TextProps & {
  variant?: 'body' | 'title' | 'subtitle' | 'heading' | 'caption';
}) {
  return <Text {...props} style={[styles.text, textStyles[variant], style]} />;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'urgent';
  disabled?: boolean;
}) {
  const palette =
    variant === 'secondary'
      ? {
          bg: colors.subtle,
          ink: colors.primary,
          pressed: colors.primaryContainer,
        }
      : variant === 'urgent'
        ? {
            bg: tiers.emergency.icon,
            ink: colors.inverse,
            pressed: tiers.emergency.text,
          }
        : {
            bg: colors.primary,
            ink: colors.inverse,
            pressed: colors.primaryActive,
          };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed ? palette.pressed : palette.bg,
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        variant === 'primary' && { boxShadow: shadows.floating },
      ]}
    >
      <AppText
        style={{
          fontFamily: fonts.display,
          color: palette.ink,
          textAlign: 'center',
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export function IconButton({
  label,
  children,
  onPress,
}: {
  label: string;
  children: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: pressed ? colors.subtle : colors.surface },
      ]}
    >
      {children}
    </Pressable>
  );
}

export function Badge({
  tier,
  title,
  subtitle,
}: {
  tier: Tier;
  title: string;
  subtitle?: string;
}) {
  const palette = tiers[tier];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: palette.background, borderColor: palette.border },
      ]}
    >
      <AppText
        style={{ color: palette.text, fontFamily: fonts.display, fontSize: 13 }}
      >
        {title}
      </AppText>
      {subtitle && (
        <AppText variant="caption" style={{ color: palette.text }}>
          {subtitle}
        </AppText>
      )}
    </View>
  );
}

export function AmenityChip({
  label,
  status = 'unknown',
}: {
  label: string;
  status?: 'available' | 'missing' | 'unknown';
}) {
  return (
    <View
      style={[
        styles.chip,
        status === 'available' && {
          backgroundColor: colors.primaryContainer,
          borderColor: '#a3ebd9',
        },
      ]}
    >
      <AppText
        style={{
          fontFamily: fonts.bold,
          fontSize: 13,
          color:
            status === 'available'
              ? colors.onPrimaryContainer
              : colors.secondary,
        }}
      >
        {label}
        {status === 'missing'
          ? ' · unavailable'
          : status === 'unknown'
            ? ' · unknown'
            : ''}
      </AppText>
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ScoreCard({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  const score =
    value !== null && Number.isFinite(value)
      ? Math.min(5, Math.max(1, value))
      : null;
  return (
    <View style={styles.scoreCard}>
      <View style={styles.row}>
        <AppText style={{ fontFamily: fonts.display, flex: 1 }}>
          {label}
        </AppText>
        <AppText style={{ color: colors.primary }}>
          {score === null ? 'No ratings yet' : `${score.toFixed(1)} / 5`}
        </AppText>
      </View>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityValue={
          score === null
            ? { text: 'No ratings yet' }
            : { min: 1, max: 5, now: score }
        }
        style={styles.track}
      >
        <View
          style={[
            styles.fill,
            { width: `${score === null ? 0 : (score / 5) * 100}%` },
          ]}
        />
      </View>
    </View>
  );
}

export function UrgentToggle({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View
      style={[
        styles.toggle,
        value && {
          backgroundColor: tiers.emergency.background,
          borderColor: tiers.emergency.border,
        },
      ]}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <AppText variant="heading">Desperate times only</AppText>
        <AppText variant="caption">
          Design preview · behavior still to be defined
        </AppText>
      </View>
      <Switch
        accessibilityLabel="Desperate times only design preview"
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.muted, true: tiers.emergency.icon }}
      />
    </View>
  );
}

// A styled content container; use a modal sheet controller when adding presentation behavior.
export function SheetSurface({ children }: { children: ReactNode }) {
  return (
    <View style={styles.sheet}>
      <View style={styles.handle} />
      {children}
    </View>
  );
}

export function SegmentedDock({
  items,
  selected,
  onSelect,
}: {
  items: readonly string[];
  selected: string;
  onSelect: (item: string) => void;
}) {
  return (
    <View style={styles.dock}>
      {items.map((item) => (
        <Pressable
          key={item}
          accessibilityRole="tab"
          accessibilityState={{ selected: selected === item }}
          onPress={() => onSelect(item)}
          style={({ pressed }) => [
            styles.dockItem,
            (selected === item || pressed) && {
              backgroundColor: colors.primaryContainer,
            },
          ]}
        >
          <AppText
            style={{
              fontFamily: fonts.display,
              color: selected === item ? colors.primary : colors.secondary,
            }}
          >
            {item}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const textStyles = StyleSheet.create({
  body: { fontSize: 16, lineHeight: 24 },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30 },
  subtitle: { fontFamily: fonts.display, fontSize: 20, lineHeight: 26 },
  heading: { fontFamily: fonts.display, fontSize: 16, lineHeight: 22 },
  caption: { fontSize: 12, lineHeight: 18, color: colors.secondary },
});
const styles = StyleSheet.create({
  text: { fontFamily: fonts.body, color: colors.ink },
  button: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: shadows.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    gap: 2,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    borderWidth: 1.5,
  },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: colors.subtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 16,
    boxShadow: shadows.md,
  },
  scoreCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: shadows.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  track: {
    height: 6,
    backgroundColor: colors.muted,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.full,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  sheet: {
    gap: 16,
    padding: 20,
    paddingBottom: 28,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: shadows.sheet,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: radii.full,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
  },
  dock: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 10,
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: shadows.lg,
  },
  dockItem: {
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: radii.full,
  },
});
