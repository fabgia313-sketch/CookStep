import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  BackHandler,
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
  ChevronRight as ChevronRightIcon,
  Play,
  Pause,
  RotateCcw,
  Wifi,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRecipe } from '@/hooks/useRecipe';
import { useTimer } from '@/hooks/useTimer';
import { getSubstitution } from '@/lib/claude';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import type { Step, Ingredient } from '@/types';

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
type ModalStep = 'list' | 'result';

interface SubstitutionModalProps {
  visible: boolean;
  onClose: () => void;
  recipeTitle: string;
  ingredients: Ingredient[];
  currentStepInstruction?: string;
}

function SubstitutionModal({
  visible,
  onClose,
  recipeTitle,
  ingredients,
  currentStepInstruction,
}: SubstitutionModalProps) {
  const [modalStep, setModalStep] = useState<ModalStep>('list');
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [streamText, setStreamText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Full reset whenever the modal opens
  useEffect(() => {
    if (visible) {
      setModalStep('list');
      setSelected(null);
      setStreamText('');
      setIsStreaming(false);
      setStreamError(null);
      abortRef.current?.abort();
      abortRef.current = null;
    }
  }, [visible]);

  // BackHandler — step back inside modal or close
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (modalStep === 'result') {
        abortRef.current?.abort();
        abortRef.current = null;
        setModalStep('list');
        setSelected(null);
        setStreamText('');
        setIsStreaming(false);
        setStreamError(null);
      } else {
        handleClose();
      }
      return true; // Always intercept when modal is open
    });
    return () => sub.remove();
  }, [visible, modalStep]);

  const handleClose = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    onClose();
  };

  const startSubstitution = async (ingredient: Ingredient) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSelected(ingredient);
    setModalStep('result');
    setStreamText('');
    setIsStreaming(true);
    setStreamError(null);

    await getSubstitution(
      ingredient.name,
      {
        recipeTitle,
        ingredients,
        currentStep: currentStepInstruction,
      },
      (chunk) => setStreamText((prev) => prev + chunk),
      () => setIsStreaming(false),
      (error) => {
        if (!controller.signal.aborted) {
          setStreamError(error);
          setIsStreaming(false);
        }
      },
      controller.signal,
    );
  };

  const handleRetry = () => {
    if (selected) startSubstitution(selected);
  };

  const handleBackToList = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setModalStep('list');
    setSelected(null);
    setStreamText('');
    setIsStreaming(false);
    setStreamError(null);
  };

  const displayText = streamText + (isStreaming && streamText.length > 0 ? '▌' : '');

  const headerTitle =
    modalStep === 'list'
      ? "J'ai pas ça 🤔"
      : selected
        ? `Remplacer ${selected.name}`
        : "J'ai pas ça 🤔";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Pressable style={modalStyles.overlay} onPress={handleClose}>
        {/* Prevent tap-through on the sheet */}
        <Pressable style={modalStyles.sheet} onPress={() => {}}>

          {/* Drag handle */}
          <View style={modalStyles.handle} />

          {/* Header row */}
          <View style={modalStyles.headerRow}>
            {modalStep === 'result' ? (
              <Pressable
                onPress={handleBackToList}
                hitSlop={8}
                style={modalStyles.headerBackBtn}
              >
                <ArrowLeft size={20} color={Colors.text} />
              </Pressable>
            ) : (
              <View style={modalStyles.headerSpacer} />
            )}

            <Text style={modalStyles.headerTitle} numberOfLines={1}>
              {headerTitle}
            </Text>

            <Pressable
              onPress={handleClose}
              hitSlop={8}
              style={modalStyles.headerCloseBtn}
            >
              <X size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {/* ── Step: list ── */}
          {modalStep === 'list' && (
            <>
              <Text style={modalStyles.listSubtitle}>
                Quel ingrédient te manque ?
              </Text>
              <ScrollView
                style={modalStyles.ingredientsList}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {ingredients.map((ing) => {
                  const qty =
                    ing.quantity != null
                      ? `${ing.quantity}${ing.unit ? ` ${ing.unit}` : ''} `
                      : '';
                  return (
                    <TouchableOpacity
                      key={ing.id}
                      style={modalStyles.ingredientRow}
                      onPress={() => startSubstitution(ing)}
                      activeOpacity={0.65}
                    >
                      <View style={modalStyles.ingredientBullet} />
                      <Text style={modalStyles.ingredientText} numberOfLines={1}>
                        <Text style={modalStyles.ingredientQty}>{qty}</Text>
                        {ing.name}
                      </Text>
                      <ChevronRightIcon size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* ── Step: result ── */}
          {modalStep === 'result' && (
            <ScrollView
              style={modalStyles.resultScroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Loading — before first token */}
              {isStreaming && streamText.length === 0 && (
                <View style={modalStyles.loadingRow}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={modalStyles.loadingText}>
                    L'assistant réfléchit…
                  </Text>
                </View>
              )}

              {/* Streaming / final text */}
              {displayText.length > 0 && (
                <Text style={modalStyles.resultText}>{displayText}</Text>
              )}

              {/* Error */}
              {streamError && (
                <View style={modalStyles.errorBox}>
                  <Text style={modalStyles.errorText}>{streamError}</Text>
                  <Pressable
                    style={({ pressed }) => [
                      modalStyles.retryButton,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={handleRetry}
                  >
                    <RefreshCw size={15} color="#fff" />
                    <Text style={modalStyles.retryButtonText}>Réessayer</Text>
                  </Pressable>
                </View>
              )}

              {/* Spacer so last line isn't cut off */}
              <View style={{ height: Spacing.xl }} />
            </ScrollView>
          )}

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Spacing.radius.xl,
    borderTopRightRadius: Spacing.radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: '72%',
  },

  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: { width: 32 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
  },
  headerCloseBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Ingredient list
  listSubtitle: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  ingredientsList: {
    maxHeight: 340,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  ingredientBullet: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    flexShrink: 0,
  },
  ingredientText: {
    flex: 1,
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text,
  },
  ingredientQty: {
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
  },

  // Result
  resultScroll: { maxHeight: 340 },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  resultText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text,
    lineHeight: Typography.size.md * 1.7,
    paddingTop: Spacing.sm,
  },

  // Error
  errorBox: {
    backgroundColor: '#FDECEA',
    borderRadius: Spacing.radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.error,
    lineHeight: Typography.size.sm * 1.5,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Spacing.radius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    fontSize: Typography.size.sm,
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
        recipeTitle={recipe!.title}
        ingredients={recipe!.ingredients}
        currentStepInstruction={step?.instruction}
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
