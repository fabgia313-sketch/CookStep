import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Clock, ChefHat, Users, Minus, Plus, Wifi } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRecipe } from '@/hooks/useRecipe';
import { usePortions } from '@/hooks/usePortions';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { recipe, loading, error, isOffline, refetch } = useRecipe(id);
  const basePortions = recipe?.portions ?? 4;
  const { portions, adjustedIngredients, increase, decrease } = usePortions(recipe?.ingredients ?? [], basePortions);

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement…</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (isOffline || error || !recipe) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
          {isOffline ? <Wifi size={48} color={Colors.textMuted} /> : <Text style={{ fontSize: 48 }}>😕</Text>}
          <Text style={styles.errorTitle}>{isOffline ? 'Pas de connexion' : 'Recette introuvable'}</Text>
          <Text style={styles.errorSubtitle}>{isOffline ? 'Connecte-toi à internet pour charger la recette.' : 'Impossible de charger cette recette.'}</Text>
          <Pressable style={styles.retryButton} onPress={refetch}><Text style={styles.retryButtonText}>Réessayer</Text></Pressable>
          <Pressable onPress={() => router.back()}><Text style={styles.backLink}>← Retour</Text></Pressable>
        </SafeAreaView>
      </View>
    );
  }

  const difficultyColor = recipe.difficulty ? Colors.difficulty[recipe.difficulty] : Colors.textMuted;

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Hero */}
          <View style={styles.heroContainer}>
            {recipe.image_url
              ? <Image source={{ uri: recipe.image_url }} style={styles.heroImage} contentFit="cover" transition={300} />
              : <View style={[styles.heroImage, styles.heroPlaceholder]}><Text style={styles.heroPlaceholderEmoji}>🍽️</Text></View>
            }
            <SafeAreaView style={styles.heroOverlay} edges={['top']}>
              <Pressable style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.75 }]} onPress={() => router.back()} hitSlop={8}>
                <ArrowLeft size={20} color="#fff" />
              </Pressable>
            </SafeAreaView>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>{recipe.title}</Text>

            <View style={styles.badgesRow}>
              {recipe.duration_min != null && (
                <View style={styles.badge}><Clock size={14} color={Colors.primary} /><Text style={styles.badgeText}>{recipe.duration_min} min</Text></View>
              )}
              {recipe.difficulty && (
                <View style={[styles.badge, styles.badgeFilled, { backgroundColor: difficultyColor }]}>
                  <ChefHat size={14} color="#fff" /><Text style={[styles.badgeText, styles.badgeTextWhite]}>{recipe.difficulty}</Text>
                </View>
              )}
              {recipe.category && (
                <View style={[styles.badge, styles.badgeCategory]}><Text style={[styles.badgeText, { color: Colors.primary }]}>{recipe.category}</Text></View>
              )}
            </View>

            {recipe.description && <Text style={styles.description}>{recipe.description}</Text>}

            <View style={styles.divider} />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ingrédients</Text>
              <View style={styles.stepper}>
                <Pressable style={({ pressed }) => [styles.stepperBtn, portions <= 1 && styles.stepperBtnDisabled, pressed && styles.stepperBtnPressed]} onPress={decrease} disabled={portions <= 1} hitSlop={6}>
                  <Minus size={16} color={portions <= 1 ? Colors.textMuted : Colors.primary} />
                </Pressable>
                <View style={styles.stepperValue}>
                  <Users size={14} color={Colors.primary} />
                  <Text style={styles.stepperText}>{portions}</Text>
                </View>
                <Pressable style={({ pressed }) => [styles.stepperBtn, portions >= 20 && styles.stepperBtnDisabled, pressed && styles.stepperBtnPressed]} onPress={increase} disabled={portions >= 20} hitSlop={6}>
                  <Plus size={16} color={portions >= 20 ? Colors.textMuted : Colors.primary} />
                </Pressable>
              </View>
            </View>

            {portions !== basePortions && (
              <Text style={styles.portionHint}>Quantités ajustées pour {portions} personne{portions > 1 ? 's' : ''}</Text>
            )}

            <View style={styles.ingredientsList}>
              {adjustedIngredients.map((ing) => (
                <View key={ing.id} style={styles.ingredientRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.ingredientText}>
                    {ing.quantity != null ? `${ing.quantity}${ing.unit ? ` ${ing.unit}` : ''} ` : ''}
                    <Text style={styles.ingredientName}>{ing.name}</Text>
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ height: 100 }} />
          </View>
        </ScrollView>

        {/* Fixed CTA */}
        <View style={styles.ctaContainer}>
          <SafeAreaView edges={['bottom']} style={styles.ctaSafeArea}>
            <Pressable
              style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/cook/${recipe.id}`);
              }}
            >
              <Text style={styles.ctaText}>C'est parti ! 🔥</Text>
            </Pressable>
          </SafeAreaView>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1 },
  heroContainer: { position: 'relative', height: 300 },
  heroImage: { width: '100%', height: 300 },
  heroPlaceholder: { backgroundColor: '#F0EAE0', alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderEmoji: { fontSize: 72 },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  backButton: { margin: Spacing.md, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.42)', alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: Spacing.screen.paddingH, paddingTop: Spacing.lg },
  title: { fontSize: Typography.size.xxl, fontFamily: Typography.fontFamily.extraBold, color: Colors.text, lineHeight: Typography.size.xxl * 1.25 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.sm + 2, paddingVertical: 5, borderRadius: Spacing.radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.card },
  badgeFilled: { borderWidth: 0 },
  badgeCategory: { borderColor: Colors.primary, backgroundColor: '#FFF2EC' },
  badgeText: { fontSize: Typography.size.sm, fontFamily: Typography.fontFamily.semiBold, color: Colors.text, textTransform: 'capitalize' },
  badgeTextWhite: { color: '#fff' },
  description: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, lineHeight: Typography.size.md * 1.65, marginTop: Spacing.md },
  divider: { height: 1, backgroundColor: Colors.border, marginTop: Spacing.lg, marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: Typography.size.lg, fontFamily: Typography.fontFamily.extraBold, color: Colors.text },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.card, borderRadius: Spacing.radius.full, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: Spacing.sm, paddingVertical: 5 },
  stepperBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepperBtnDisabled: { opacity: 0.4 },
  stepperBtnPressed: { backgroundColor: Colors.border },
  stepperValue: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 36, justifyContent: 'center' },
  stepperText: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.bold, color: Colors.text },
  portionHint: { fontSize: Typography.size.xs, fontFamily: Typography.fontFamily.semiBold, color: Colors.primary, marginBottom: Spacing.sm, fontStyle: 'italic' },
  ingredientsList: { gap: 2 },
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.border },
  bullet: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 6, flexShrink: 0 },
  ingredientText: { flex: 1, fontSize: Typography.size.md, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary },
  ingredientName: { fontFamily: Typography.fontFamily.semiBold, color: Colors.text },
  ctaContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12 },
  ctaSafeArea: { paddingHorizontal: Spacing.screen.paddingH, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  ctaButton: { backgroundColor: Colors.primary, borderRadius: Spacing.radius.full, height: 56, alignItems: 'center', justifyContent: 'center' },
  ctaButtonPressed: { opacity: 0.88 },
  ctaText: { fontSize: Typography.size.lg, fontFamily: Typography.fontFamily.extraBold, color: '#fff', letterSpacing: 0.3 },
  loadingText: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary },
  errorTitle: { fontSize: Typography.size.xl, fontFamily: Typography.fontFamily.extraBold, color: Colors.text, textAlign: 'center' },
  errorSubtitle: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, textAlign: 'center', lineHeight: Typography.size.md * 1.5 },
  retryButton: { backgroundColor: Colors.primary, borderRadius: Spacing.radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm },
  retryButtonText: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.bold, color: '#fff' },
  backLink: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.semiBold, color: Colors.primary },
});
