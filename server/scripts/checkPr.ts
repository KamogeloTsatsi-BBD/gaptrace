import '../src/lib/loadEnv.js'
import { resolveCodeSource } from '../src/sources/codeSource.js'

for (const url of process.argv.slice(2)) {
  try {
    const resolved = await resolveCodeSource({ kind: 'pr', prUrl: url })
    console.log(`${url} -> ${resolved.diffText.length} chars`)
    console.log(resolved.diffText.split('\n').slice(0, 4).join('\n'))
  } catch (error) {
    console.log(`${url} -> ERR ${(error as Error).name}: ${(error as Error).message}`)
  }
}
