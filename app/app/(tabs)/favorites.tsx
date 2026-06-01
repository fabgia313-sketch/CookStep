import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, LogIn } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';

export default function FavoritesScreen() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();
  const { recipes, loading, fetchFavorites } = useFavoritesStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchFavorites(user.id);
    setRefreshing(false);
  }, [user]);

  if (!initialized) {
    return <SafeAreaView style={styles.container} edges={['top']}><View style={styles.loading}><ActivityIndicator size="large" color={Colors.primary} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Favoris</Text>
        {user && recipes.length > 0 && <Text style={styles.count}>{recipes.length} recette{recipes.length > 1 ? 's' : ''}</Text>}
      </View>

      {!user ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>❤️</Text>
          <Text style={styles.emptyTitle}>Tes favoris t'attendent</Text>
          <Text style={styles.emptyText}>Connecte-toi pour sauvegarder tes recettes préférées.</Text>
          <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.88 }]} onPress={() => router.push('/auth')}>
            <LogIn size={18} color="#fff" />
            <Text style={styles.btnText}>Se connecter</Text>
          </Pressable>
        </View>
      ) : loading && !refreshing ? (
        <View style={styles.loading}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : recipes.length === 0 ? (
        <View style={styles.empty}>
          <Heart size={56} color={Colors.border} />
          <Text style={styles.emptyTitle}>Pas encore de favoris</Text>
          <Text style={styles.emptyText}>Appuie sur le ❤️ d'une recette pour la retrouver ici !</Text>
          <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.88 }]} onPress={() => router.push('/')}>
            <Text style={styles.btnText}>Explorer les recettes</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={recipes} keyExtractor={(item) => item.id} numColumns={2}
          contentContainerStyle={styles.listContent} columnWrapperStyle={styles.row}
          renderItem={({ item }) => <RecipeCard recipe={item} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: Spacing.screen.paddingH, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontSize: Typography.size.xxl, fontFamily: Typography.fontFamily.extraBold, color: Colors.text },
  count: { fontSize: Typography.size.sm, fontFamily: Typography.fontFamily.semiBold, color: Colors.textSecondary },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: Typography.size.lg, fontFamily: Typography.fontFamily.extraBold, color: Colors.text, textAlign: 'center' },
  emptyText: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, textAlign: 'center', lineHeight: Typography.size.md * 1.5 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Spacing.radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm },
  btnText: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.bold, color: '#fff' },
  listContent: { paddingHorizontal: Spacing.screen.paddingH, paddingTop: Spacing.sm, paddingBottom: Spacing.xl, gap: Spacing.md },
  row: { gap: Spacing.md },
});
