import { generateDirectusTypes } from 'directus-sdk-typegen'

const directusUrl = process.env.NUXT_PUBLIC_API_BASE_URL
const directusToken = process.env.DIRECTUS_TOKEN

if (!directusUrl || !directusToken) {
  console.error('NUXT_PUBLIC_API_BASE_URL and DIRECTUS_TOKEN must be set (put the token in .env.local)')
  process.exit(1)
}

await generateDirectusTypes({
  outputPath: 'app/types/directus-schema.ts',
  directusUrl,
  directusToken
})

console.log('Types generated at app/types/directus-schema.ts')
