/**
 * CookStep — Script d'import des recettes dans Supabase
 * Usage : npx ts-node scripts/import-recipes.ts
 *
 * Prérequis :
 *   - Variables d'env SUPABASE_URL et SUPABASE_SERVICE_KEY dans .env
 *   - npm install @supabase/supabase-js dotenv ts-node typescript
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import recipes from '../data/recipes.json'
import steps from '../data/steps.json'
import ingredients from '../data/ingredients.json'

dotenv.config()

// ⚠️ Utiliser la SERVICE KEY (pas anon) pour bypasser le RLS en import
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function importAll() {
  console.log('🍳 Début de l\'import CookStep...\n')

  // ── 1. Recettes ──────────────────────────────────────────────────
  console.log(`📖 Import de ${recipes.length} recettes...`)
  const { error: recipesError } = await supabase
    .from('recipes')
    .upsert(recipes, { onConflict: 'id' })

  if (recipesError) {
    console.error('❌ Erreur recettes :', recipesError.message)
    process.exit(1)
  }
  console.log('✅ Recettes importées\n')

  // ── 2. Étapes ────────────────────────────────────────────────────
  console.log(`🔢 Import de ${steps.length} étapes...`)
  // Chunker par 200 pour rester sous la limite Supabase
  const stepChunks = chunkArray(steps, 200)
  for (const chunk of stepChunks) {
    const { error } = await supabase.from('steps').insert(chunk)
    if (error) {
      console.error('❌ Erreur étapes :', error.message)
      process.exit(1)
    }
  }
  console.log('✅ Étapes importées\n')

  // ── 3. Ingrédients ───────────────────────────────────────────────
  console.log(`🥕 Import de ${ingredients.length} ingrédients...`)
  const ingredientChunks = chunkArray(ingredients, 200)
  for (const chunk of ingredientChunks) {
    const { error } = await supabase.from('ingredients').insert(chunk)
    if (error) {
      console.error('❌ Erreur ingrédients :', error.message)
      process.exit(1)
    }
  }
  console.log('✅ Ingrédients importés\n')

  // ── Résumé ───────────────────────────────────────────────────────
  console.log('🎉 Import terminé avec succès !')
  console.log(`   ${recipes.length} recettes`)
  console.log(`   ${steps.length} étapes`)
  console.log(`   ${ingredients.length} ingrédients`)
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

importAll().catch((err) => {
  console.error('💥 Erreur inattendue :', err)
  process.exit(1)
})
