import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Wifi,
} from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRecipe } from '@/hooks/useRecipe';
import { useTimer } from '@/hooks/useTimer';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import type { Step } from '@/types';

// ─── Circular timer constants ─────────────────────────────────────────────────
const TIMER_SIZE = 200;
const STROKE_WIDTH = 12;
const RADIUS = (TIMER_SIZE - STROKE_WIDTH) / 2;   // 94
const CENTER = TIMER_SIZE / 2;                     // 100
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;        // ≈ 590.6

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── CircularTimer ────────────────────────────────────────────────────────────
interface CircularTimerProps {
  seconds: number;
  total: number;
  done: boolean;
}

function CircularTimer({ seconds, total, done }: CircularTimerProps) {
  const progressAnim = useSharedValue(1);

  useEffect(() => {
    const ratio = total > 0 ? seconds / total : 0;
    progressAnim.value = withTiming(ratio, {
      duration: 600,
      easing: Easing.out(Easing.quad),
    });
  }, [seconds, total]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progressAnim.value),
  }));

  const strokeColor = done ? Colors.success : Colors.primary;

  return (
    <View style={timerStyles.container}>
      <Svg
        width={TIMER_SIZE}
        height={TIMER_SIZE}
        viewBox={`0 0 ${TIMER_SIZE} ${TIMER_SIZE}`}
      >
        {/* Track */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke={Colors.border}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        {/* Progress arc — rotated so it starts at top */}
        <AnimatedCircle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke={strokeColor}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${CENTER}, ${CENTER}`}
        />
      </Svg>

      {/* Center content */}
      <View style={timerStyles.center}>
        {done ? (
          <Text style={timerStyles.doneEmoji}>✓</Text>
        ) : (
          <Text style={[timerStyles.time, { color: strokeColor }]}>
            {Math.floor(seconds / 60).toString().padStart(2, '0')}:
            {(seconds % 60).toString().padStart(2, '0')}
          </Text>
        )}
      </View>
    </View>
  );
}

const timerStyles = StyleSheet.create({
  container: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    fontSize: Typography.size.xxxl,
    fontFamily: Typography.fontFamily.extraBold,
    letterSpacing: 2,
  },
  doneEmoji: {
    fontSize: 52,
    color: Colors.success,
  },
});

// ─── SubstitutionModal ────────────────────────────────────────────────────────
function SubstitutionModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={modalStyles.overlay} onPress={onClose}>
        <Pressable style={modalStyles.sheet} onPress={() => {}}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>J'ai pas ça 🤔</Text>
          <Text style={modalStyles.subtitle}>
            Bientôt disponible ✨
          </Text>
          <Text style={modalStyles.body}>
            L'assistant IA pourra bientôt te suggérer une substitution intelligente pour
            n'importe quel ingrédient. Tu n'auras jamais à abandonner une recette !
          </Text>
          <Pressable style={modalStyles.closeButton} onPress={onClose}>
            <Text style={modalStyles.closeButtonText}>OK, j'attends !</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Spacing.radius.xl,
    borderTopRightRadius: Spacing.radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
    textAlign: 'center',
  },
  body: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: Typography.size.md * 1.6,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: Colors.primary,
    borderRadius: Spacing.radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  closeButtonText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.bold,
    color: '#fff',
  },
});

// ─── CongratulationsScreen ────────────────────────────────────────────────────
function CongratulationsScreen({
  recipeTitle,
  onGoHome,
  onBackToRecipe,
}: {
  recipeTitle: string;
  onGoHome: () => void;
  onBackToRecipe: () => void;
}) {
  const scaleAnim = useSharedValue(0.5);
  const opacityAnim = useSharedValue(0);

  useEffect(() => {
    scaleAnim.value = withSpring(1, { damping: 12, stiffness: 120 });
    opacityAnim.value = withTiming(1, { duration: 400 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    opacity: opacityAnim.value,
  }));

  return (
    <SafeAreaView style={congratsStyles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <Animated.View style={[congratsStyles.content, animStyle]}>
        <Text style={congratsStyles.emoji}>🎉</Text>
        <Text style={congratsStyles.title}>Bravo, c'est prêt !</Text>
        <Text style={congratsStyles.recipeName}>{recipeTitle}</Text>
        <Text style={congratsStyles.subtitle}>Bon appétit ! 😋</Text>
      </Animated.View>

      <View style={congratsStyles.actions}>
        <Pressable
          style={({ pressed }) => [congratsStyles.primaryBtn, pressed && { opacity: 0.88 }]}
          onPress={onGoHome}
        >
          <Text style={congratsStyles.primaryBtnText}>Retour à l'accueil</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [congratsStyles.ghostBtn, pressed && { opacity: 0.6 }]}
          onPress={onBackToRecipe}
        >
          <Text style={congratsStyles.ghostBtnText}>Revoir la recette</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const congratsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    justifyContent: 'space-between',
    padding: Spacing.xl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  emoji: { fontSize: 80 },
  title: {
    fontSize: Typography.size.xxxl,
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: Typography.size.xxxl * 1.2,
  },
  recipeName: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actions: { gap: Spacing.md },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Spacing.radius.full,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.extraBold,
    color: '#fff',
  },
  ghostBtn: {
    borderRadius: Spacing.radius.full,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
  },
});

// ─── LoadingScreen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>Chargement de la recette…</Text>
    </SafeAreaView>
  );
}

// ─── ErrorScreen ──────────────────────────────────────────────────────────────
function ErrorScreen({
  isOffline,
  onBack,
  onRetry,
}: {
  isOffline: boolean;
  onBack: () => void;
  onRetry: () => void;
}) {
  return (
    <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
      {isOffline ? (
        <Wifi size={48} color={Colors.textMuted} />
      ) : (
        <Text style={{ fontSize: 48 }}>😕</Text>
      )}
      <Text style={styles.errorTitle}>
        {isOffline ? 'Pas de connexion' : 'Erreur de chargement'}
      </Text>
      <Text style={styles.errorSubtitle}>
        {isOffline
          ? 'Connecte-toi à internet pour cuisiner.'
          : 'Impossible de charger les étapes.'}
      </Text>
      <Pressable style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>Réessayer</Text>
      </Pressable>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>← Retour</Text>
      </Pressable>
    </SafeAreaView>
  );
}

// ─── ProgressBar (animated) ───────────────────────────────────────────────────
function AnimatedProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const [barWidth, setBarWidth] = useState(0);
  const progressAnim = useSharedValue(0);

  useEffect(() => {
    if (total > 0) {
      progressAnim.value = withTiming((current + 1) / total, {
        duration: 350,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [current, total]);

  const animStyle = useAnimatedStyle(() => ({
    width: progressAnim.value * barWidth,
  }));

  return (
    <View
      style={styles.progressTrack}
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View style={[styles.progressFill, animStyle]} />
    </View>
  );
}

// ─── Main CookScreen ──────────────────────────────────────────────────────────
export default function CookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { recipe, loading, error, isOffline, refetch } = useRecipe(id);

  const [currentStep, setCurrentStep] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const steps: Step[] = recipe?.steps ?? [];
  const step = steps[currentStep];
  const hasTimer = (step?.duration_sec ?? 0) > 0;

  const { seconds, running, done: timerDone, started, start, pause, reset, format } =
    useTimer(step?.duration_sec ?? 0);

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleNext = useCallback(() => {
    if (isLast) {
      setIsDone(true);
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [isLast]);

  const handlePrev = useCallback(() => {
    if (!isFirst) setCurrentStep((s) => s - 1);
  }, [isFirst]);

  // ── Loading ──
  if (loading) return <LoadingScreen />;

  // ── Error / Offline ──
  if (isOffline || error || (!loading && !recipe)) {
    return (
      <ErrorScreen
        isOffline={isOffline}
        onBack={() => router.back()}
        onRetry={refetch}
      />
    );
  }

  // ── Congratulations ──
  if (isDone) {
    return (
      <CongratulationsScreen
        recipeTitle={recipe!.title}
        onGoHome={() => router.replace('/')}
        onBackToRecipe={() => router.back()}
      />
    );
  }

  // ── Cooking mode ──
  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.container} edges={['top']}>

        {/* TOP BAR */}
        <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <X size={20} color={Colors.text} />
          </Pressable>

          <Text style={styles.recipeTitle} numberOfLines={1}>
            {recipe!.title}
          </Text>

          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              {currentStep + 1}/{steps.length}
            </Text>
          </View>
        </View>

        {/* PROGRESS BAR */}
        <AnimatedProgressBar current={currentStep} total={steps.length} />

        {/* STEP CONTENT */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Step label */}
          <Text style={styles.stepLabel}>
            ÉTAPE {currentStep + 1} SUR {steps.length}
          </Text>

          {/* Main instruction */}
          <Text style={styles.instruction}>{step?.instruction}</Text>

          {/* Timer section */}
          {hasTimer && (
            <View style={styles.timerSection}>
              <CircularTimer
                seconds={seconds}
                total={step!.duration_sec!}
                done={timerDone}
              />

              {/* Timer controls */}
              <View style={styles.timerControls}>
                {!started ? (
                  // Not started yet — show big "Démarrer"
                  <Pressable
                    style={({ pressed }) => [styles.timerStartBtn, pressed && { opacity: 0.88 }]}
                    onPress={start}
                  >
                    <Play size={20} color="#fff" fill="#fff" />
                    <Text style={styles.timerStartBtnText}>Démarrer</Text>
                  </Pressable>
                ) : timerDone ? (
                  // Done — show success + reset option
                  <View style={styles.timerDoneRow}>
                    <Text style={styles.timerDoneText}>C'est bon ! 👌</Text>
                    <Pressable
                      style={({ pressed }) => [styles.timerResetBtn, pressed && { opacity: 0.7 }]}
                      onPress={reset}
                    >
                      <RotateCcw size={16} color={Colors.textSecondary} />
                      <Text style={styles.timerResetText}>Relancer</Text>
                    </Pressable>
                  </View>
                ) : running ? (
                  // Running — show Pause
                  <Pressable
                    style={({ pressed }) => [styles.timerPauseBtn, pressed && { opacity: 0.88 }]}
                    onPress={pause}
                  >
                    <Pause size={20} color={Colors.primary} fill={Colors.primary} />
                    <Text style={styles.timerPauseBtnText}>Pause</Text>
                  </Pressable>
                ) : (
                  // Paused — show Reprendre
                  <Pressable
                    style={({ pressed }) => [styles.timerStartBtn, pressed && { opacity: 0.88 }]}
                    onPress={start}
                  >
                    <Play size={20} color="#fff" fill="#fff" />
                    <Text style={styles.timerStartBtnText}>Reprendre</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Bottom spacer so content isn't hidden under floating button */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* FLOATING "J'ai pas ça 🤔" BUTTON */}
        <Pressable
          style={({ pressed }) => [styles.floatingBtn, pressed && styles.floatingBtnPressed]}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.floatingBtnText}>J'ai pas ça 🤔</Text>
        </Pressable>

        {/* BOTTOM NAV */}
        <SafeAreaView edges={['bottom']} style={styles.navWrapper}>
          <View style={styles.navRow}>
            {/* Précédent */}
            <Pressable
              style={({ pressed }) => [
                styles.prevButton,
                isFirst && styles.btnDisabled,
                pressed && !isFirst && { opacity: 0.7 },
              ]}
              onPress={handlePrev}
              disabled={isFirst}
            >
              <ChevronLeft
                size={22}
                color={isFirst ? Colors.textMuted : Colors.text}
              />
              <Text style={[styles.prevLabel, isFirst && styles.prevLabelDisabled]}>
                Précédent
              </Text>
            </Pressable>

            {/* Suivant / Terminé */}
            {isLast ? (
              <Pressable
                style={({ pressed }) => [styles.finishButton, pressed && { opacity: 0.88 }]}
                onPress={handleNext}
              >
                <Text style={styles.nextLabel}>Terminé 🎉</Text>
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.nextButton, pressed && { opacity: 0.88 }]}
                onPress={handleNext}
              >
                <Text style={styles.nextLabel}>Suivant</Text>
                <ChevronRight size={22} color="#fff" />
              </Pressable>
            )}
          </View>
        </SafeAreaView>

      </SafeAreaView>

      {/* MODAL */}
      <SubstitutionModal
        visible={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },

  // Top bar
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
    flexShrink: 0,
  },
  recipeTitle: {
    flex: 1,
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  stepBadge: {
    backgroundColor: Colors.primary + '1A', // 10% opacity
    borderRadius: Spacing.radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  stepBadgeText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },

  // Progress bar
  progressTrack: {
    height: 5,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.screen.paddingH,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },

  // Step content
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.screen.paddingH,
    paddingTop: Spacing.xl,
  },
  stepLabel: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  instruction: {
    fontSize: Typography.size.xl + 2, // intentionally large — mains mouillées !
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
    lineHeight: (Typography.size.xl + 2) * 1.5,
  },

  // Timer section
  timerSection: {
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  timerControls: { alignItems: 'center' },
  timerStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Spacing.radius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  timerStartBtnText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.bold,
    color: '#fff',
  },
  timerPauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Spacing.radius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  timerPauseBtnText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  timerDoneRow: { alignItems: 'center', gap: Spacing.sm },
  timerDoneText: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.success,
  },
  timerResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: Spacing.sm,
  },
  timerResetText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
  },

  // Floating button
  floatingBtn: {
    position: 'absolute',
    bottom: 90,
    right: Spacing.screen.paddingH,
    backgroundColor: Colors.card,
    borderRadius: Spacing.radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  floatingBtnPressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  floatingBtnText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },

  // Nav row
  navWrapper: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen.paddingH,
    paddingVertical: Spacing.md,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  btnDisabled: { opacity: 0.3 },
  prevLabel: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text,
  },
  prevLabelDisabled: { color: Colors.textMuted },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: Spacing.radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minWidth: 140,
    justifyContent: 'center',
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.success,
    borderRadius: Spacing.radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minWidth: 140,
    justifyContent: 'center',
  },
  nextLabel: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.bold,
    color: '#fff',
  },

  // Loading / Error
  loadingText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  errorTitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.md * 1.5,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Spacing.radius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  retryBtnText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.bold,
    color: '#fff',
  },
  backLink: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary,
  },
});
