import 'dotenv/config'
import { normalizeNiche } from '../lib/pineconeNicheNormalize'

async function main() {
  const samples = process.argv.slice(2)
  const testInputs = samples.length > 0
    ? samples
    : [
        'Digital Marketing',
        'Car Repair',
        'Numerology',
        'WordPress Course',
        'Health & Wellness',
        'Fashion'
      ]

  console.log('Testing normalizeNiche on inputs:', testInputs)

  for (const input of testInputs) {
    try {
      const result = await normalizeNiche(input)
      console.log(`\n🧪 Input: "${input}"`)
      if (result) {
        console.log(`➡️  Normalized: ${result.name} (score: ${result.score.toFixed(3)})`)
      } else {
        console.log('➡️  No confident match (null)')
      }
    } catch (e) {
      console.error(`Error testing "${input}":`, e instanceof Error ? e.message : e)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


