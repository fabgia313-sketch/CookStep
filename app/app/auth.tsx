import {
  View, Text, TextInput, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';

type AuthMode = 'signin' | 'signup';

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle, loading, error, clearError } = useAuthStore();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const displayError = localError ?? error;

  const handleSubmit = async () => {
    setLocalError(null); setSuccessMessage(null); clearError();
    if (!email.trim()) { setLocalError('Saisis ton adresse email.'); return; }
    if (password.length < 6) { setLocalError('Le mot de passe doit faire au moins 6 caractères.'); return; }
    try {
      if (mode === 'signin') { await signIn(email.trim(), password); router.replace('/'); }
      else { await signUp(email.trim(), password); setSuccessMessage('Compte créé ! Vérifie ta boîte mail.'); }
    } catch { /* error stored in store */ }
  };

  const switchMode = (m: AuthMode) => { setMode(m); setLocalError(null); setSuccessMessage(null); clearError(); };

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Pressable style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]} onPress={() => router.back()} hitSlop={8}>
              <ArrowLeft size={22} color={Colors.text} />
            </Pressable>

            <View style={styles.header}>
              <Text style={styles.logo}>🍳</Text>
              <Text style={styles.appName}>CookStep</Text>
              <Text style={styles.tagline}>{mode === 'signin' ? 'Bon retour parmi nous !' : 'Rejoins la communauté !'}</Text>
            </View>

            <View style={styles.modeSwitcher}>
              {(['signin', 'signup'] as AuthMode[]).map((m) => (
                <Pressable key={m} style={[styles.modeTab, mode === m && styles.modeTabActive]} onPress={() => switchMode(m)}>
                  <Text style={[styles.modeTabText, mode === m && styles.modeTabTextActive]}>{m === 'signin' ? 'Se connecter' : "S'inscrire"}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <Mail size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Email" placeholderTextColor={Colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} returnKeyType="next" />
              </View>

              <View style={styles.inputWrapper}>
                <Lock size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput style={[styles.input, styles.inputPassword]} placeholder="Mot de passe" placeholderTextColor={Colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} returnKeyType="done" onSubmitEditing={handleSubmit} />
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8} style={styles.eyeButton}>
                  {showPassword ? <EyeOff size={18} color={Colors.textSecondary} /> : <Eye size={18} color={Colors.textSecondary} />}
                </Pressable>
              </View>

              {displayError && <View style={styles.errorBox}><Text style={styles.errorText}>{displayError}</Text></View>}
              {successMessage && <View style={styles.successBox}><Text style={styles.successText}>{successMessage}</Text></View>}

              <Pressable style={({ pressed }) => [styles.submitButton, pressed && { opacity: 0.88 }, loading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitButtonText}>{mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}</Text>}
              </Pressable>

              <View style={styles.divider}>
                <View style={styles.dividerLine} /><Text style={styles.dividerText}>ou</Text><View style={styles.dividerLine} />
              </View>

              <Pressable style={({ pressed }) => [styles.googleButton, pressed && { opacity: 0.85 }]} onPress={signInWithGoogle} disabled={loading}>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>Continuer avec Google</Text>
              </Pressable>
            </View>

            <Text style={styles.footerNote}>En continuant, tu acceptes nos conditions d'utilisation.</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: Spacing.screen.paddingH, paddingBottom: Spacing.xl },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  header: { alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.xl },
  logo: { fontSize: 52 },
  appName: { fontSize: Typography.size.xxl, fontFamily: Typography.fontFamily.extraBold, color: Colors.primary },
  tagline: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, marginTop: Spacing.xs },
  modeSwitcher: { flexDirection: 'row', backgroundColor: Colors.border, borderRadius: Spacing.radius.lg, padding: 4, marginBottom: Spacing.xl },
  modeTab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Spacing.radius.md, alignItems: 'center' },
  modeTabActive: { backgroundColor: Colors.background, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  modeTabText: { fontSize: Typography.size.sm, fontFamily: Typography.fontFamily.semiBold, color: Colors.textSecondary },
  modeTabTextActive: { color: Colors.text, fontFamily: Typography.fontFamily.bold },
  form: { gap: Spacing.md },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Spacing.radius.md, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: Spacing.md, height: 52 },
  inputIcon: { marginRight: Spacing.sm, flexShrink: 0 },
  input: { flex: 1, fontSize: Typography.size.md, fontFamily: Typography.fontFamily.regular, color: Colors.text },
  inputPassword: { paddingRight: Spacing.xl },
  eyeButton: { position: 'absolute', right: Spacing.md, padding: 4 },
  errorBox: { backgroundColor: '#FDECEA', borderRadius: Spacing.radius.md, padding: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.error },
  errorText: { fontSize: Typography.size.sm, fontFamily: Typography.fontFamily.semiBold, color: Colors.error },
  successBox: { backgroundColor: '#EAF7EA', borderRadius: Spacing.radius.md, padding: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.success },
  successText: { fontSize: Typography.size.sm, fontFamily: Typography.fontFamily.semiBold, color: Colors.success },
  submitButton: { backgroundColor: Colors.primary, borderRadius: Spacing.radius.full, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { fontSize: Typography.size.lg, fontFamily: Typography.fontFamily.extraBold, color: '#fff' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: Typography.size.sm, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.card, borderRadius: Spacing.radius.full, height: 52, borderWidth: 1.5, borderColor: Colors.border },
  googleIcon: { fontSize: Typography.size.lg, fontFamily: Typography.fontFamily.extraBold, color: '#4285F4' },
  googleButtonText: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.semiBold, color: Colors.text },
  footerNote: { fontSize: Typography.size.xs, fontFamily: Typography.fontFamily.regular, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xl },
});
