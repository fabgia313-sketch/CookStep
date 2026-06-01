import { Pressable, View, Text, Image, StyleSheet } from 'react-native';
import { Clock, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Recipe } from '@/types';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const router = useRouter();

  const difficultyColor = recipe.difficulty ? Colors.difficulty[recipe.difficulty] : Colors.textMuted;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
      onPress={() => router.push(`/recipe/${recipe.id}`)}
    >
      <View style={styles.imageContainer}>
        {recipe.image_url ? (
          <Image source={{ uri: recipe.image_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderEmoji}>🍽️</Text>
          </View>
        )}
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
  imageContainer: { position: 'relative' },
  image: { width: '100%', aspectRatio: 1 },
  imagePlaceholder: { backgroundColor: '#F0EAE0', alignItems: 'center', justifyContent: 'center' },
  placeholderEmoji: { fontSize: 32 },
  badge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Spacing.radius.full,
  },
  badgeText: {
    color: '#fff',
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.bold,
    textTransform: 'capitalize',
  },
  content: { padding: Spacing.sm, gap: 4 },
  title: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    lineHeight: Typography.size.sm * 1.4,
  },
  meta: { flexDirection: 'row', gap: Spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
});
