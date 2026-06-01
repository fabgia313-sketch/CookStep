import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, ChevronLeft, ChevronRight, Timer } from 'lucide-react-native';
import { useState } from 'react';
import { useRecipe } from '@/hooks/useRecipe';
import { useTimer } from '@/hooks/useTimer';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';

export default function CookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { recipe, loading } = useRecipe(id);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = recipe?.steps ?? [];
  const step = steps[currentStep];
  const { running, start, pause, format } = useTimer(step?.duration_sec ?? 0);

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  if (loading || !recipe) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <X size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.recipeTitle} numberOfLines={1}>{recipe.title}</Text>
        <Text style={styles.stepCounter}>{currentStep + 1}/{steps.length}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((currentStep + 1) / steps.length) * 100}%` }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.stepLabel}>Étape {currentStep + 1}</Text>
        <Text style={styles.instruction}>{step?.instruction}</Text>

        {step?.duration_sec != null && step.duration_sec > 0 && (
          <Pressable
            style={[styles.timerButton, running && styles.timerButtonActive]}
            onPress={running ? pause : start}
          >
            <Timer size={20} color={running ? '#fff' : Colors.primary} />
            <Text style={[styles.timerText, running && styles.timerTextActive]}>{format()}</Text>
          </Pressable>
        )}
      </ScrollView>

      <View style={styles.navRow}>
        <Pressable
          style={[styles.prevButton, isFirst && styles.prevButtonDisabled]}
          onPress={() => !isFirst && setCurrentStep((s) => s - 1)}
          disabled={isFirst}
        >
          <ChevronLeft size={24} color={isFirst ? Colors.border : Colors.text} />
          <Text style={[styles.prevLabel, isFirst && styles.prevLabelDisabled]}>Précédent</Text>
        </Pressable>

        {isLast ? (
          <Pressable style={styles.finishButton} onPress={() => router.back()}>
            <Text style={styles.finishText}>Terminé !</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.nextButton} onPress={() => setCurrentStep((s) => s + 1)}>
            <Text style={styles.nextText}>Suivant</Text>
            <ChevronRight size={24} color="#fff" />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen.paddingH,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeTitle: {
    flex: 1,
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  stepCounter: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.screen.paddingH,
    borderRadius: 2,
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.screen.paddingH,
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },
  stepLabel: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  instruction: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
    lineHeight: Typography.size.xl * 1.5,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.radius.full,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  timerButtonActive: { backgroundColor: Colors.primary },
  timerText: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  timerTextActive: { color: '#fff' },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen.paddingH,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  prevButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  prevButtonDisabled: { opacity: 0.3 },
  prevLabel: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.semiBold, color: Colors.text },
  prevLabelDisabled: { color: Colors.border },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.radius.full,
  },
  nextText: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.bold, color: '#fff' },
  finishButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.radius.full,
  },
  finishText: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.bold, color: '#fff' },
});
