import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, LogIn, UserPlus, LogOut, Heart, ChefHat, Mail } from 'lucide-react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';

// ─── Not connected view ───────────────────────────────────────────────────────
function GuestView() {
  const router = useRouter();
  return (
    <View style={styles.guestContainer}>
      <View style={styles.avatarPlaceholder}>
        <User size={44} color={Colors.textSecondary} />
      </View>
      <Text style={styles.guestTitle}>Bienvenue !</Text>
      <Text style={styles.guestSubtitle}>
        Connecte-toi pour retrouver tes favoris et personnaliser ton expérience.
      </Text>
      <Pressable
        style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.88 }]}
        onPress={() => router.push('/auth')}
      >
        <LogIn size={18} color="#fff" />
        <Text style={styles.primaryBtnText}>Se connecter</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.75 }]}
        onPress={() => router.push('/auth')}
      >
        <UserPlus size={18} color={Colors.primary} />
        <Text style={styles.secondaryBtnText}>Créer un compte</Text>
      </Pressable>
    </View>
  );
}

// ─── Connected view ───────────────────────────────────────────────────────────
function ConnectedView() {
  const { user, signOut, loading } = useAuthStore();
  const { recipes: favoriteRecipes } = useFavoritesStore();

  const email = user?.email ?? '';
  const displayName = user?.user_metadata?.full_name
    ?? user?.user_metadata?.name
    ?? email.split('@')[0]
    ?? 'Chef CookStep';

  const handleSignOut = () => {
    Alert.alert(
      'Se déconnecter',
      'Tu veux vraiment te déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  return (
    <View style={styles.connectedContainer}>
      {/* Avatar */}
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarInitial}>
          {displayName.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Name + email */}
      <Text style={styles.displayName}>{displayName}</Text>
      <View style={styles.emailRow}>
        <Mail size={14} color={Colors.textSecondary} />
        <Text style={styles.emailText}>{email}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Heart size={20} color={Colors.primary} fill={Colors.primary} />
          <Text style={styles.statValue}>{favoriteRecipes.length}</Text>
          <Text style={styles.statLabel}>Favoris</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <ChefHat size={20} color={Colors.primary} />
          <Text style={styles.statValue}>—</Text>
          <Text style={styles.statLabel}>Recettes cuisinées</Text>
        </View>
      </View>

      {/* Sign out */}
      <Pressable
        style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.75 }, loading && { opacity: 0.5 }]}
        onPress={handleSignOut}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={Colors.error} />
        ) : (
          <>
            <LogOut size={18} color={Colors.error} />
            <Text style={styles.signOutText}>Se déconnecter</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user, initialized } = useAuthStore();

  if (!initialized) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mon Profil</Text>
      </View>
      {user ? <ConnectedView /> : <GuestView />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.screen.paddingH,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.size.xxl,
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Guest
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  guestTitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
  },
  guestSubtitle: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.md * 1.5,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Spacing.radius.full,
    paddingHorizontal: Spacing.xl,
    height: 52,
    width: '100%',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  primaryBtnText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.bold,
    color: '#fff',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Spacing.radius.full,
    paddingHorizontal: Spacing.xl,
    height: 52,
    width: '100%',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  secondaryBtnText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },

  // Connected
  connectedContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.screen.paddingH,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarInitial: {
    fontSize: 40,
    fontFamily: Typography.fontFamily.extraBold,
    color: '#fff',
  },
  displayName: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
    textAlign: 'center',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  emailText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.lg,
    width: '100%',
    marginTop: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  statValue: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.text,
  },
  statLabel: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.radius.full,
    borderWidth: 1.5,
    borderColor: '#FDECEA',
    backgroundColor: '#FDECEA',
  },
  signOutText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.error,
  },
});
