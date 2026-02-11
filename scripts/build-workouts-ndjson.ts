/**
 * Builds a single NDJSON file from the workouts folder for static hosting.
 * Run from project root: npx tsx src/scripts/build-workouts-ndjson.ts
 * Output: public/workouts.ndjson (first line = _meta with total, then one workout per line)
 */
import fs from 'node:fs'
import path from 'node:path'
import type { CustomWorkout, NdJsonMeta } from '../src/types'

const WORKOUTS_DIR = path.join(process.cwd(), 'workouts')
const OUT_DIR = path.join(process.cwd(), 'public')
const OUT_FILE = path.join(OUT_DIR, 'workouts.ndjson')

function build() {
  if (!fs.existsSync(WORKOUTS_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true })
    fs.writeFileSync(
      OUT_FILE,
      JSON.stringify({ _meta: { total: 0 } } satisfies NdJsonMeta) + '\n',
      'utf-8',
    )
    console.log('No workouts folder found; wrote empty workouts.ndjson')
    return
  }

  const files = fs.readdirSync(WORKOUTS_DIR).filter((f) => f.endsWith('.json'))
  const lines: string[] = []
  for (const file of files) {
    const raw = fs.readFileSync(path.join(WORKOUTS_DIR, file), 'utf-8')
    const data: CustomWorkout = JSON.parse(raw)
    if (data.pathHasIssue === true) continue
    if ([data.geoJson, data.workout, data.route, data.activityType].some((field) => !field)) {
      console.warn(`Skipping ${file}: missing required fields`)
      continue
    }
    lines.push(JSON.stringify(data))
  }

  const total = lines.length
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const content =
    [JSON.stringify({ _meta: { total } } satisfies NdJsonMeta), ...lines].join('\n') + '\n'
  fs.writeFileSync(OUT_FILE, content, 'utf-8')
  console.log(`Wrote ${OUT_FILE} with ${total} workouts`)
}

build()
