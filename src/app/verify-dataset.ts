import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import manifest from '../../docs/dataset-manifest.json'

export function verifyDataset(directory: string): void {
  for (const [file, expected] of Object.entries(manifest.files)) {
    const actual = createHash('sha256').update(readFileSync(join(directory, file))).digest('hex')
    if (actual !== expected) throw new Error(`Dataset hash mismatch: ${file}; obtain the pinned data or explicitly update its manifest`)
  }
}
