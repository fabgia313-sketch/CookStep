import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, LogIn, UserPlus, LogOut, Heart, ChefHat, Mail } from 'lucide-react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, initialized, signOut, loading } = useAuthStore();
  const { recipes: favoriteRecipes } = useFavoritesStore();

  if (!initialized) {
    return <SafeAreaView style={styles.container} edges={['top']}><View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View></SafeAreaView>;
  }

  const handleSignOut = () => {
    Alert.alert('Se déconnecter', 'Tu veux vraiment te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: signOut },
    ]);
  };

  const displayName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Chef';
  const email = user?.email ?? '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}><Text style={styles.title}>Mon Profil</Text></View>

      {!user ? (
        <View style={styles.guestContainer}>
          <View style={styles.avatarPlaceholder}><User size={44} color={Colors.textSecondary} /></View>
          <Text style={styles.guestTitle}>Bienvenue !</Text>
          <Text style={styles.guestText}>Connecte-toi pour retrouver tes favoris.</Text>
          <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.88 }]} onPress={() => router.push('/auth')}>
            <LogIn size={18} color="#fff" /><Text style={styles.primaryBtnText}>Se connecter</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.75 }]} onPress={() => router.push('/auth')}>
            <UserPlus size={18} color={Colors.primary} /><Text style={styles.secondaryBtnText}>Créer un compte</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.connectedContainer}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <View style={styles.emailRow}>
            <Mail size={14} color={Colors.textSecondary} />
            <Text style={styles.emailText}>{email}</Text>
          </View>

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
              <Text style={styles.statLabel}>Cuisinées</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.75 }, loading && { opacity: 0.5 }]}
            onPress={handleSignOut} disabled={loading}
          >
            {loading ? <ActivityIndicator size="small" color={Colors.error} /> : <><LogOut size={18} color={Colors.error} /><Text style={styles.signOutText}>Se déconnecter</Text></>}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.screen.paddingH, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontSize: Typography.size.xxl, fontFamily: Typography.fontFamily.extraBold, color: Colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  guestContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  guestTitle: { fontSize: Typography.size.xl, fontFamily: Typography.fontFamily.extraBold, color: Colors.text },
  guestText: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, textAlign: 'center' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Spacing.radius.full, paddingHorizontal: Spacing.xl, height: 52, width: '100%', justifyContent: 'center', marginTop: Spacing.sm },
  primaryBtnText: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.bold, color: '#fff' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Spacing.radius.full, height: 52, width: '100%', justifyContent: 'center', borderWidth: 2, borderColor: Colors.primary },
  secondaryBtnText: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.bold, color: Colors.primary },
  connectedContainer: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.screen.paddingH, paddingTop: Spacing.xl, gap: Spacing.md },
  avatarCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  avatarInitial: { fontSize: 40, fontFamily: Typography.fontFamily.extraBold, color: '#fff' },
  displayName: { fontSize: Typography.size.xl, fontFamily: Typography.fontFamily.extraBold, color: Colors.text, textAlign: 'center' },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  emailText: { fontSize: Typography.size.sm, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Spacing.radius.lg, padding: Spacing.lg, width: '100%', marginTop: Spacing.md, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  statValue: { fontSize: Typography.size.xl, fontFamily: Typography.fontFamily.extraBold, color: Colors.text },
  statLabel: { fontSize: Typography.size.xs, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, textAlign: 'center' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xl, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: Spacing.radius.full, borderWidth: 1.5, borderColor: '#FDECEA', backgroundColor: '#FDECEA' },
  signOutText: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.semiBold, color: Colors.error },
});
