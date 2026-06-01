import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

// ─── Single pulsing box ───────────────────────────────────────────────────────
function SkeletonBox({ style }: { style: object }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.35, { duration: 750, easing: Easing.inOut(Easing.ease) }),
      -1,   // infinite
      true  // reverse (ping-pong)
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.box, style, animStyle]} />;
}

// ─── One card skeleton (matches RecipeCard proportions) ───────────────────────
function RecipeCardSkeleton() {
  return (
    <View style={styles.card}>
      {/* Image area — square 1:1 */}
      <SkeletonBox style={styles.image} />
      {/* Text area */}
      <View style={styles.content}>
        <SkeletonBox style={styles.titleLine1} />
        <SkeletonBox style={styles.titleLine2} />
        <View style={styles.metaRow}>
          <SkeletonBox style={styles.metaChip} />
          <SkeletonBox style={styles.metaChip} />
        </View>
      </View>
    </View>
  );
}

// ─── 6-card skeleton grid (matches FlatList numColumns=2) ────────────────────
export function SkeletonGrid() {
  const rows = [0, 1, 2]; // 3 rows × 2 cols = 6 cards

  return (
    <View style={styles.grid}>
      {rows.map((row) => (
        <View key={row} style={styles.gridRow}>
          <View style={styles.gridCell}><RecipeCardSkeleton /></View>
          <View style={styles.gridCell}><RecipeCardSkeleton /></View>
        </View>
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const SKELETON_COLOR = Colors.border; // #EDE8E0 — warm grey

const styles = StyleSheet.create({
  // Skeleton box base
  box: {
    backgroundColor: SKELETON_COLOR,
    borderRadius: Spacing.radius.sm,
  },

  // Card
  card: {
    backgroundColor: Colors.card,
    borderRadius: Spacing.radius.lg,
    overflow: 'hidden',
    flex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 0, // override — image fills edge to edge
  },
  content: {
    padding: Spacing.sm,
    gap: 6,
  },
  titleLine1: {
    height: 12,
    width: '85%',
  },
  titleLine2: {
    height: 12,
    width: '60%',
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 2,
  },
  metaChip: {
    height: 10,
    width: 48,
    borderRadius: Spacing.radius.sm,
  },

  // Grid layout (mirrors FlatList structure)
  grid: {
    paddingHorizontal: Spacing.screen.paddingH,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  gridCell: {
    flex: 1,
  },
});
