import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Clock, Users, Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Recipe } from '@/types';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useAuthStore } from '@/stores/useAuthStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isFavorite, toggle } = useFavoritesStore();
  const favorited = isFavorite(recipe.id);
  const difficultyColor = recipe.difficulty ? Colors.difficulty[recipe.difficulty] : Colors.textMuted;

  // ── Heart pulse animation ──────────────────────────────────────────────────
  const heartScale = useSharedValue(1);
  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleFavorite = () => {
    // Pulse: scale up then spring back
    heartScale.value = withSpring(1.35, { damping: 4, stiffness: 300 }, () => {
      heartScale.value = withSpring(1, { damping: 10, stiffness: 200 });
    });
    // Light haptic tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Action
    if (user) toggle(recipe.id, user.id);
    else router.push('/auth');
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
      onPress={() => router.push(`/recipe/${recipe.id}`)}
    >
      <View style={styles.imageContainer}>
        {recipe.image_url
          ? <Image source={{ uri: recipe.image_url }} style={styles.image} contentFit="cover" transition={200} />
          : <View style={[styles.image, styles.imagePlaceholder]}><Text style={styles.placeholderEmoji}>🍽️</Text></View>
        }

        {/* Heart button — top left, with animated inner icon */}
        <Pressable
          style={styles.heartButton}
          onPress={handleFavorite}
          hitSlop={6}
        >
          <Animated.View style={heartAnimStyle}>
            <Heart
              size={16}
              color={favorited ? Colors.primary : '#fff'}
              fill={favorited ? Colors.primary : 'transparent'}
            />
          </Animated.View>
        </Pressable>

        {/* Difficulty badge — top right */}
        {recipe.difficulty && (
          <View style={[styles.badge, { backgroundColor: difficultyColor }]}>
            <Text style={styles.badgeText}>{recipe.difficulty}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
        <View style={styles.meta}>
          {recipe.duration_min != null && (
            <View style={styles.metaItem}>
              <Clock size={12} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{recipe.duration_min} min</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Users size={12} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{recipe.portions} pers.</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: Spacing.radius.lg,
    overflow: 'hidden', flex: 1, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8,
  },
  imageContainer: { position: 'relative' },
  image: { width: '100%', aspectRatio: 1 },
  imagePlaceholder: { backgroundColor: '#F0EAE0', alignItems: 'center', justifyContent: 'center' },
  placeholderEmoji: { fontSize: 32 },
  heartButton: {
    position: 'absolute', top: Spacing.sm, left: Spacing.sm,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: Spacing.sm, right: Spacing.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderRadius: Spacing.radius.full,
  },
  badgeText: { color: '#fff', fontSize: Typography.size.xs, fontFamily: Typography.fontFamily.bold, textTransform: 'capitalize' },
  content: { padding: Spacing.sm, gap: 4 },
  title: { fontSize: Typography.size.sm, fontFamily: Typography.fontFamily.bold, color: Colors.text, lineHeight: Typography.size.sm * 1.4 },
  meta: { flexDirection: 'row', gap: Spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: Typography.size.xs, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary },
});
