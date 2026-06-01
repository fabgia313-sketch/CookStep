import {
  View, Text, FlatList, TextInput, StyleSheet,
  RefreshControl, ScrollView, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react-native';
import { useRecipeStore } from '@/stores/useRecipeStore';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';

const CATEGORIES = ['Tous', 'Entrée', 'Plat', 'Dessert', 'Petit-déjeuner', 'Snack', 'Apéritif'];

export default function ExplorerScreen() {
  const { fetchRecipes, loading, error, isOffline, setSearchQuery, setSelectedCategory, selectedCategory, searchQuery, filteredRecipes } = useRecipeStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchRecipes(); }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchRecipes(); setRefreshing(false); };
  const recipes = filteredRecipes();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📶 Mode hors ligne — Recettes en cache</Text>
        </View>
      )}
      <View style={styles.header}>
        <Text style={styles.title}>CookStep</Text>
        <Text style={styles.subtitle}>Qu'est-ce qu'on cuisine ?</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une recette..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
        {CATEGORIES.map((cat) => {
          const isActive = cat === 'Tous' ? !selectedCategory : selectedCategory === cat;
          return (
            <Pressable key={cat} style={[styles.chip, isActive && styles.chipActive]} onPress={() => setSelectedCategory(cat === 'Tous' ? null : cat)}>
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{cat}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading && !refreshing ? (
        <SkeletonGrid />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Impossible de charger les recettes</Text>
          <Pressable onPress={fetchRecipes} style={styles.retryButton}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => <RecipeCard recipe={item} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>Aucune recette trouvée</Text></View>}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  offlineBanner: { backgroundColor: '#FFF3CD', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.screen.paddingH, borderBottomWidth: 1, borderBottomColor: '#FFEAA7' },
  offlineText: { fontSize: Typography.size.sm, fontFamily: Typography.fontFamily.semiBold, color: '#856404', textAlign: 'center' },
  header: { paddingHorizontal: Spacing.screen.paddingH, paddingTop: Spacing.md, paddingBottom: Spacing.xs },
  title: { fontSize: Typography.size.xxl, fontFamily: Typography.fontFamily.extraBold, color: Colors.primary },
  subtitle: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, marginTop: 2 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.card,
    marginHorizontal: Spacing.screen.paddingH, marginVertical: Spacing.sm,
    borderRadius: Spacing.radius.full, paddingHorizontal: Spacing.md, height: 48,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  searchInput: { flex: 1, fontSize: Typography.size.md, fontFamily: Typography.fontFamily.regular, color: Colors.text },
  categoriesContainer: { paddingHorizontal: Spacing.screen.paddingH, gap: Spacing.sm, paddingBottom: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Spacing.radius.full, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Typography.size.sm, fontFamily: Typography.fontFamily.semiBold, color: Colors.textSecondary },
  chipTextActive: { color: '#FFFFFF' },
  listContent: { paddingHorizontal: Spacing.screen.paddingH, paddingTop: Spacing.sm, paddingBottom: Spacing.xl, gap: Spacing.md },
  row: { gap: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl },
  errorText: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, marginBottom: Spacing.md },
  retryButton: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Spacing.radius.full },
  retryText: { color: '#fff', fontFamily: Typography.fontFamily.bold, fontSize: Typography.size.md },
  emptyText: { fontSize: Typography.size.md, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary },
});
