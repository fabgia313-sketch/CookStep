import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, Users } from 'lucide-react-native';
import { useRecipe } from '@/hooks/useRecipe';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { Button } from '@/components/ui/Button';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { recipe, loading, error } = useRecipe(id);

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.center} edges={['top']}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </SafeAreaView>
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.center} edges={['top']}>
          <Text style={styles.errorText}>Recette introuvable</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>Retour</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  const difficultyColor = recipe.difficulty ? Colors.difficulty[recipe.difficulty] : Colors.textMuted;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          {recipe.image_url ? (
            <Image source={{ uri: recipe.image_url }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={styles.placeholderEmoji}>🍽️</Text>
            </View>
          )}
          <SafeAreaView style={styles.imageOverlay} edges={['top']}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={22} color="#fff" />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{recipe.title}</Text>

          <View style={styles.metaRow}>
            {recipe.duration_min != null && (
              <View style={styles.metaItem}>
                <Clock size={16} color={Colors.primary} />
                <Text style={styles.metaText}>{recipe.duration_min} min</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Users size={16} color={Colors.primary} />
              <Text style={styles.metaText}>{recipe.portions} personnes</Text>
            </View>
            {recipe.difficulty && (
              <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
                <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
              </View>
            )}
          </View>

          {recipe.description && (
            <Text style={styles.description}>{recipe.description}</Text>
          )}

          <Text style={styles.sectionTitle}>Ingrédients</Text>
          {recipe.ingredients.map((ing) => (
            <View key={ing.id} style={styles.ingredientRow}>
              <View style={styles.bullet} />
              <Text style={styles.ingredientText}>
                {ing.quantity != null ? `${ing.quantity}${ing.unit ? ` ${ing.unit}` : ''} ` : ''}
                {ing.name}
              </Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Préparation</Text>
          {recipe.steps.map((step) => (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.order_num}</Text>
              </View>
              <Text style={styles.stepText}>{step.instruction}</Text>
            </View>
          ))}

          <View style={styles.cookButtonContainer}>
            <Button
              label="Cuisiner maintenant"
              onPress={() => router.push(`/cook/${recipe.id}`)}
              size="lg"
              style={styles.cookButton}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 300 },
  imagePlaceholder: { backgroundColor: '#F0EAE0', alignItems: 'center', justifyContent: 'center' },
  placeholderEmoji: { fontSize: 64 },
  imageOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  backButton: {
    margin: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: Spacing.screen.paddingH, gap: Spacing.sm },
  title: {
    fontSize: Typography.size.xxl,
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Spacing.radius.full,
  },
  difficultyText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.bold,
    color: '#fff',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: Typography.size.md * 1.6,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingVertical: 4 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 7 },
  ingredientText: {
    flex: 1,
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberText: { fontSize: Typography.size.sm, fontFamily: Typography.fontFamily.bold, color: '#fff' },
  stepText: {
    flex: 1,
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text,
    lineHeight: Typography.size.md * 1.5,
    paddingTop: 5,
  },
  cookButtonContainer: { marginTop: Spacing.xl, marginBottom: Spacing.xl },
  cookButton: { width: '100%' },
  errorText: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  backLink: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.bold, color: Colors.primary },
});
