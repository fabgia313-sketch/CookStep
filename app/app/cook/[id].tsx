import {
  View, Text, StyleSheet, Pressable, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps, withTiming, withSpring, Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import {
  X, ChevronLeft, ChevronRight, Play, Pause, RotateCcw,
  Wifi, ArrowLeft, RefreshCw,
} from 'lucide-react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRecipe } from '@/hooks/useRecipe';
import { useTimer } from '@/hooks/useTimer';
import { getSubstitution } from '@/lib/claude';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import type { Step, Ingredient } from '@/types';

// ─── Circular Timer ───────────────────────────────────────────────────────────
const TIMER_SIZE = 200;
const STROKE_WIDTH = 12;
const RADIUS = (TIMER_SIZE - STROKE_WIDTH) / 2;
const CENTER = TIMER_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function CircularTimer({ seconds, total, done }: { seconds: number; total: number; done: boolean }) {
  const progressAnim = useSharedValue(1);

  useEffect(() => {
    progressAnim.value = withTiming(total > 0 ? seconds / total : 0, { duration: 600, easing: Easing.out(Easing.quad) });
  }, [seconds, total]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: CIRCUMFERENCE * (1 - progressAnim.value) }));
  const strokeColor = done ? Colors.success : Colors.primary;

  return (
    <View style={timerStyles.container}>
      <Svg width={TIMER_SIZE} height={TIMER_SIZE} viewBox={`0 0 ${TIMER_SIZE} ${TIMER_SIZE}`}>
        <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke={Colors.border} strokeWidth={STROKE_WIDTH} fill="none" />
        <AnimatedCircle cx={CENTER} cy={CENTER} r={RADIUS} stroke={strokeColor} strokeWidth={STROKE_WIDTH} fill="none" strokeDasharray={CIRCUMFERENCE} animatedProps={animatedProps} strokeLinecap="round" rotation="-90" origin={`${CENTER}, ${CENTER}`} />
      </Svg>
      <View style={timerStyles.center}>
        {done
          ? <Text style={timerStyles.doneEmoji}>✓</Text>
          : <Text style={[timerStyles.time, { color: strokeColor }]}>{Math.floor(seconds / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')}</Text>
        }
      </View>
    </View>
  );
}

const timerStyles = StyleSheet.create({
  container: { width: TIMER_SIZE, height: TIMER_SIZE, alignSelf: 'center', justifyContent: 'center', alignItems: 'center' },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  time: { fontSize: Typography.size.xxxl, fontFamily: Typography.fontFamily.extraBold, letterSpacing: 2 },
  doneEmoji: { fontSize: 52, color: Colors.success },
});

// ─── Substitution Modal ───────────────────────────────────────────────────────
type ModalStep = 'list' | 'result';

function SubstitutionModal({ visible, onClose, recipeTitle, ingredients, currentStepInstruction }: {
  visible: boolean; onClose: () => void; recipeTitle: string;
  ingredients: Ingredient[]; currentStepInstruction?: string;
}) {
  const [modalStep, setModalStep] = useState<ModalStep>('list');
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [streamText, setStreamText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (visible) {
      setModalStep('list'); setSelected(null);
      setStreamText(''); setIsStreaming(false); setStreamError(null);
      abortRef.current?.abort(); abortRef.current = null;
    }
  }, [visible]);

  // Pas de BackHandler ici — le Modal gère déjà le retour Android via onRequestClose

  const handleClose = () => { abortRef.current?.abort(); abortRef.current = null; onClose(); };

  const startSubstitution = async (ingredient: Ingredient) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSelected(ingredient); setModalStep('result');
    setStreamText(''); setIsStreaming(true); setStreamError(null);

    try {
      await getSubstitution(
        ingredient.name,
        { recipeTitle, ingredients, currentStep: currentStepInstruction },
        (chunk) => { if (!controller.signal.aborted) setStreamText((prev) => prev + chunk); },
        () => { if (!controller.signal.aborted) setIsStreaming(false); },
        (error) => { if (!controller.signal.aborted) { setStreamError(error); setIsStreaming(false); } },
        controller.signal,
      );
    } catch {
      if (!controller.signal.aborted) {
        setStreamError("Une erreur inattendue s'est produite.");
        setIsStreaming(false);
      }
    }
  };

  const handleRetry = () => { if (selected) startSubstitution(selected); };

  const handleBackToList = () => {
    abortRef.current?.abort(); abortRef.current = null;
    setModalStep('list'); setSelected(null); setStreamText(''); setIsStreaming(false); setStreamError(null);
  };

  const displayText = streamText + (isStreaming && streamText.length > 0 ? '▌' : '');
  const headerTitle = modalStep === 'list' ? "J'ai pas ça 🤔" : selected ? `Remplacer ${selected.name}` : "J'ai pas ça 🤔";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={modalStyles.overlay} onPress={handleClose}>
        {/*
          View + onStartShouldSetResponder stoppe vraiment la propagation en new arch.
          Pressable onPress={() => {}} ne suffit plus avec newArchEnabled: true.
        */}
        <View style={modalStyles.sheet} onStartShouldSetResponder={() => true}>
          <View style={modalStyles.handle} />
          <View style={modalStyles.headerRow}>
            {modalStep === 'result'
              ? <Pressable onPress={handleBackToList} hitSlop={8} style={modalStyles.headerBtn}><ArrowLeft size={20} color={Colors.text} /></Pressable>
              : <View style={modalStyles.headerBtn} />
            }
            <Text style={modalStyles.headerTitle} numberOfLines={1}>{headerTitle}</Text>
            <Pressable onPress={handleClose} hitSlop={8} style={modalStyles.headerBtn}><X size={20} color={Colors.textSecondary} /></Pressable>
          </View>

          {modalStep === 'list' && (
            <>
              <Text style={modalStyles.listSubtitle}>Quel ingrédient te manque ?</Text>
              <ScrollView style={modalStyles.ingredientsList} showsVerticalScrollIndicator={false} bounces={false}>
                {ingredients.map((ing) => {
                  const qty = ing.quantity != null ? `${ing.quantity}${ing.unit ? ` ${ing.unit}` : ''} ` : '';
                  return (
                    <TouchableOpacity key={ing.id} style={modalStyles.ingredientRow} onPress={() => startSubstitution(ing)} activeOpacity={0.65}>
                      <View style={modalStyles.ingredientBullet} />
                      <Text style={modalStyles.ingredientText} numberOfLines={1}>
                        <Text style={modalStyles.ingredientQty}>{qty}</Text>{ing.name}
                      </Text>
                      <ChevronRight size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {modalStep === 'result' && (
            <ScrollView style={modalStyles.resultScroll} showsVerticalScrollIndicator={false} bounces={false}>
              {isStreaming && streamText.length === 0 && (
                <View style={modalStyles.loadingRow}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={modalStyles.loadingText}>L'assistant réfléchit…</Text>
                </View>
              )}
              {displayText.length > 0 && <Text style={modalStyles.resultText}>{displayText}</Text>}
              {streamError && (
                <View style={modalStyles.errorBox}>
                  <Text style={modalStyles.errorText}>{streamError}</Text>
                  <Pressable style={({ pressed }) => [modalStyles.retryBtn, pressed && { opacity: 0.8 }]} onPress={handleRetry}>
                    <RefreshCw size={15} color="#fff" />
                    <Text style={modalStyles.retryBtnText}>Réessayer</Text>
                  </Pressable>
                </View>
              )}
              <View style={{ height: Spacing.xl }} />
            </ScrollView>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.background, borderTopLeftRadius: Spacing.radius.xl, borderTopRightRadius: Spacing.radius.xl, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, maxHeight: '72%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.sm, marginBottom: Spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  headerBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: Typography.size.lg, fontFamily: Typography.fontFamily.extraBold, color: Colors.text },
  listSubtitle: { fontSize: Typography.size.sm, fontFamily: Typography.fontFamily.semiBold, color: Colors.textSecondary, marginBottom: Spacing.sm },
  ingredientsList: { maxHeight: 340 },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.sm },
  ingredientBullet: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary, flexShrink: 0 },
  ingredientText: { flex: 1, fontSize: Typography.size.md, fontFamily: Typography.fontFamily.regular, color: Colors.text },
  ingredientQty: { fontFamily: Typography.fontFamily.semiBold, color: Colors.textSecondary },
  resultScroll: { maxHeight: 340 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  loadingText: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary },
  resultText: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.regular, color: Colors.text, lineHeight: Typography.size.md * 1.7, paddingTop: Spacing.sm },
  errorBox: { backgroundColor: '#FDECEA', borderRadius: Spacing.radius.md, padding: Spacing.md, gap: Spacing.md, marginTop: Spacing.md },
  errorText: { fontSize: Typography.size.sm, fontFamily: Typography.fontFamily.regular, color: Colors.error, lineHeight: Typography.size.sm * 1.5 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Spacing.radius.full, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, alignSelf: 'flex-start' },
  retryBtnText: { fontSize: Typography.size.sm, fontFamily: Typography.fontFamily.bold, color: '#fff' },
});

// ─── Congratulations Screen ───────────────────────────────────────────────────
function CongratulationsScreen({ recipeTitle, onGoHome, onBackToRecipe }: { recipeTitle: string; onGoHome: () => void; onBackToRecipe: () => void }) {
  const scaleAnim = useSharedValue(0.5);
  const opacityAnim = useSharedValue(0);

  useEffect(() => {
    scaleAnim.value = withSpring(1, { damping: 12, stiffness: 120 });
    opacityAnim.value = withTiming(1, { duration: 400 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scaleAnim.value }], opacity: opacityAnim.value }));

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
        <Pressable style={({ pressed }) => [congratsStyles.primaryBtn, pressed && { opacity: 0.88 }]} onPress={onGoHome}>
          <Text style={congratsStyles.primaryBtnText}>Retour à l'accueil</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [congratsStyles.ghostBtn, pressed && { opacity: 0.6 }]} onPress={onBackToRecipe}>
          <Text style={congratsStyles.ghostBtnText}>Revoir la recette</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const congratsStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0', justifyContent: 'space-between', padding: Spacing.xl },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emoji: { fontSize: 80 },
  title: { fontSize: Typography.size.xxxl, fontFamily: Typography.fontFamily.extraBold, color: Colors.text, textAlign: 'center', lineHeight: Typography.size.xxxl * 1.2 },
  recipeName: { fontSize: Typography.size.lg, fontFamily: Typography.fontFamily.semiBold, color: Colors.primary, textAlign: 'center' },
  subtitle: { fontSize: Typography.size.xl, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, textAlign: 'center' },
  actions: { gap: Spacing.md },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: Spacing.radius.full, height: 56, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontSize: Typography.size.lg, fontFamily: Typography.fontFamily.extraBold, color: '#fff' },
  ghostBtn: { borderRadius: Spacing.radius.full, height: 48, alignItems: 'center', justifyContent: 'center' },
  ghostBtnText: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.semiBold, color: Colors.textSecondary },
});

// ─── Animated Progress Bar ────────────────────────────────────────────────────
function AnimatedProgressBar({ current, total }: { current: number; total: number }) {
  const [barWidth, setBarWidth] = useState(0);
  const progressAnim = useSharedValue(0);

  useEffect(() => {
    if (total > 0) progressAnim.value = withTiming((current + 1) / total, { duration: 350, easing: Easing.out(Easing.quad) });
  }, [current, total]);

  const animStyle = useAnimatedStyle(() => ({ width: progressAnim.value * barWidth }));

  return (
    <View style={styles.progressTrack} onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}>
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
  const { seconds, running, done: timerDone, started, start, pause, reset } = useTimer(step?.duration_sec ?? 0);
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) setIsDone(true); else setCurrentStep((s) => s + 1);
  }, [isLast]);

  const handlePrev = useCallback(() => {
    if (!isFirst) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep((s) => s - 1);
    }
  }, [isFirst]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement de la recette…</Text>
      </SafeAreaView>
    );
  }

  if (isOffline || error || (!loading && !recipe)) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
        {isOffline ? <Wifi size={48} color={Colors.textMuted} /> : <Text style={{ fontSize: 48 }}>😕</Text>}
        <Text style={styles.errorTitle}>{isOffline ? 'Pas de connexion' : 'Erreur de chargement'}</Text>
        <Text style={styles.errorSubtitle}>{isOffline ? 'Connecte-toi à internet pour cuisiner.' : 'Impossible de charger les étapes.'}</Text>
        <Pressable style={styles.retryBtn} onPress={refetch}><Text style={styles.retryBtnText}>Réessayer</Text></Pressable>
        <Pressable onPress={() => router.back()}><Text style={styles.backLink}>← Retour</Text></Pressable>
      </SafeAreaView>
    );
  }

  if (isDone) {
    return <CongratulationsScreen recipeTitle={recipe!.title} onGoHome={() => router.replace('/')} onBackToRecipe={() => router.back()} />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]} onPress={() => router.back()} hitSlop={8}>
            <X size={20} color={Colors.text} />
          </Pressable>
          <Text style={styles.recipeTitle} numberOfLines={1}>{recipe!.title}</Text>
          <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>{currentStep + 1}/{steps.length}</Text></View>
        </View>

        <AnimatedProgressBar current={currentStep} total={steps.length} />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.stepLabel}>ÉTAPE {currentStep + 1} SUR {steps.length}</Text>
          <Text style={styles.instruction}>{step?.instruction}</Text>

          {hasTimer && (
            <View style={styles.timerSection}>
              <CircularTimer seconds={seconds} total={step!.duration_sec!} done={timerDone} />
              <View style={styles.timerControls}>
                {!started ? (
                  <Pressable style={({ pressed }) => [styles.timerStartBtn, pressed && { opacity: 0.88 }]} onPress={start}>
                    <Play size={20} color="#fff" fill="#fff" /><Text style={styles.timerStartBtnText}>Démarrer</Text>
                  </Pressable>
                ) : timerDone ? (
                  <View style={styles.timerDoneRow}>
                    <Text style={styles.timerDoneText}>C'est bon ! 👌</Text>
                    <Pressable style={({ pressed }) => [styles.timerResetBtn, pressed && { opacity: 0.7 }]} onPress={reset}>
                      <RotateCcw size={16} color={Colors.textSecondary} /><Text style={styles.timerResetText}>Relancer</Text>
                    </Pressable>
                  </View>
                ) : running ? (
                  <Pressable style={({ pressed }) => [styles.timerPauseBtn, pressed && { opacity: 0.88 }]} onPress={pause}>
                    <Pause size={20} color={Colors.primary} fill={Colors.primary} /><Text style={styles.timerPauseBtnText}>Pause</Text>
                  </Pressable>
                ) : (
                  <Pressable style={({ pressed }) => [styles.timerStartBtn, pressed && { opacity: 0.88 }]} onPress={start}>
                    <Play size={20} color="#fff" fill="#fff" /><Text style={styles.timerStartBtnText}>Reprendre</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Floating button */}
        <Pressable style={({ pressed }) => [styles.floatingBtn, pressed && styles.floatingBtnPressed]} onPress={() => setShowModal(true)}>
          <Text style={styles.floatingBtnText}>J'ai pas ça 🤔</Text>
        </Pressable>

        {/* Nav */}
        <SafeAreaView edges={['bottom']} style={styles.navWrapper}>
          <View style={styles.navRow}>
            <Pressable style={({ pressed }) => [styles.prevButton, isFirst && styles.btnDisabled, pressed && !isFirst && { opacity: 0.7 }]} onPress={handlePrev} disabled={isFirst}>
              <ChevronLeft size={22} color={isFirst ? Colors.textMuted : Colors.text} />
              <Text style={[styles.prevLabel, isFirst && styles.prevLabelDisabled]}>Précédent</Text>
            </Pressable>
            {isLast ? (
              <Pressable style={({ pressed }) => [styles.finishButton, pressed && { opacity: 0.88 }]} onPress={handleNext}>
                <Text style={styles.nextLabel}>Terminé 🎉</Text>
              </Pressable>
            ) : (
              <Pressable style={({ pressed }) => [styles.nextButton, pressed && { opacity: 0.88 }]} onPress={handleNext}>
                <Text style={styles.nextLabel}>Suivant</Text><ChevronRight size={22} color="#fff" />
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </SafeAreaView>

      <SubstitutionModal
        visible={showModal} onClose={() => setShowModal(false)}
        recipeTitle={recipe!.title} ingredients={recipe!.ingredients}
        currentStepInstruction={step?.instruction}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screen.paddingH, paddingVertical: Spacing.sm, gap: Spacing.sm },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  recipeTitle: { flex: 1, fontSize: Typography.size.md, fontFamily: Typography.fontFamily.bold, color: Colors.text },
  stepBadge: { backgroundColor: Colors.primary + '1A', borderRadius: Spacing.radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  stepBadgeText: { fontSize: Typography.size.sm, fontFamily: Typography.fontFamily.bold, color: Colors.primary },
  progressTrack: { height: 5, backgroundColor: Colors.border, marginHorizontal: Spacing.screen.paddingH, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.screen.paddingH, paddingTop: Spacing.xl },
  stepLabel: { fontSize: Typography.size.xs, fontFamily: Typography.fontFamily.bold, color: Colors.primary, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: Spacing.md },
  instruction: { fontSize: Typography.size.xl + 2, fontFamily: Typography.fontFamily.extraBold, color: Colors.text, lineHeight: (Typography.size.xl + 2) * 1.5 },
  timerSection: { alignItems: 'center', gap: Spacing.lg, marginTop: Spacing.xl, paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  timerControls: { alignItems: 'center' },
  timerStartBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Spacing.radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  timerStartBtnText: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.bold, color: '#fff' },
  timerPauseBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Spacing.radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderWidth: 2, borderColor: Colors.primary },
  timerPauseBtnText: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.bold, color: Colors.primary },
  timerDoneRow: { alignItems: 'center', gap: Spacing.sm },
  timerDoneText: { fontSize: Typography.size.lg, fontFamily: Typography.fontFamily.extraBold, color: Colors.success },
  timerResetBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: Spacing.sm },
  timerResetText: { fontSize: Typography.size.sm, fontFamily: Typography.fontFamily.semiBold, color: Colors.textSecondary },
  floatingBtn: { position: 'absolute', bottom: 90, right: Spacing.screen.paddingH, backgroundColor: Colors.card, borderRadius: Spacing.radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1.5, borderColor: Colors.border, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8 },
  floatingBtnPressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  floatingBtnText: { fontSize: Typography.size.sm, fontFamily: Typography.fontFamily.bold, color: Colors.text },
  navWrapper: { borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screen.paddingH, paddingVertical: Spacing.md },
  prevButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm },
  btnDisabled: { opacity: 0.3 },
  prevLabel: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.semiBold, color: Colors.text },
  prevLabelDisabled: { color: Colors.textMuted },
  nextButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: Spacing.radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, minWidth: 140, justifyContent: 'center' },
  finishButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.success, borderRadius: Spacing.radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, minWidth: 140, justifyContent: 'center' },
  nextLabel: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.bold, color: '#fff' },
  loadingText: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary },
  errorTitle: { fontSize: Typography.size.xl, fontFamily: Typography.fontFamily.extraBold, color: Colors.text, textAlign: 'center' },
  errorSubtitle: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, textAlign: 'center', lineHeight: Typography.size.md * 1.5 },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: Spacing.radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm },
  retryBtnText: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.bold, color: '#fff' },
  backLink: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.semiBold, color: Colors.primary },
});
