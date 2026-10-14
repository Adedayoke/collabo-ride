// Regenerate typed code for every language from one OpenAPI source (spec 0009).
//   TS: orval (fetch client, TanStack Query hooks, Zod schemas)
//   Go: oapi-codegen into services/dispatch/internal/contract (from a 3.0 copy, see below)
//   Python: datamodel-code-generator (Pydantic v2) into services/fraud/app/contract
// The split source is bundled into one file first so all three read the same input.
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const contractsDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(contractsDir, '../..')

function run(cmd, args, cwd) {
  execFileSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
}

/**
 * @param {object} o
 * @param {string} o.input       OpenAPI root file
 * @param {string} o.tsDir       output folder for client.ts and zod.ts
 * @param {string} o.goFile      output .go file, inside services/dispatch
 * @param {string} o.goPackage   Go package name
 * @param {string} o.pyFile      output .py file, inside services/fraud
 */
export function generate({ input, tsDir, goFile, goPackage, pyFile }) {
  const bundled = join(tsDir, 'openapi.bundled.yaml')
  rmSync(tsDir, { recursive: true, force: true })
  mkdirSync(tsDir, { recursive: true })
  mkdirSync(dirname(goFile), { recursive: true })
  mkdirSync(dirname(pyFile), { recursive: true })

  // Paths are passed relative to each cwd: the Windows shell splits arguments on spaces.
  run(
    'pnpm',
    ['exec', 'redocly', 'bundle', relative(contractsDir, input), '--output', relative(contractsDir, bundled)],
    contractsDir,
  )

  writeFileSync(join(tsDir, 'orval.config.json'), JSON.stringify(orvalConfig(bundled, tsDir)))
  run('pnpm', ['exec', 'orval', '--config', relative(contractsDir, join(tsDir, 'orval.config.json'))], contractsDir)
  rmSync(join(tsDir, 'orval.config.json'))

  // oapi-codegen cannot read 3.1 nullable types (`type: [string, 'null']`), so Go
  // generates from a copy converted to 3.0 (`nullable: true`, `const` to `enum`).
  // The 3.1 file stays the source of truth (smoke test 2 found this).
  const bundled30 = join(tsDir, 'openapi.bundled.3.0.yaml')
  run(
    'pnpm',
    [
      'exec',
      'openapi-down-convert',
      '--input',
      relative(contractsDir, bundled),
      '--output',
      relative(contractsDir, bundled30),
    ],
    contractsDir,
  )

  const dispatchDir = join(repoRoot, 'services/dispatch')
  run(
    'go',
    [
      'tool',
      'oapi-codegen',
      '-generate',
      'types,client',
      '-package',
      goPackage,
      '-o',
      relative(dispatchDir, goFile),
      relative(dispatchDir, bundled30),
    ],
    dispatchDir,
  )

  const fraudDir = join(repoRoot, 'services/fraud')
  run(
    'uv',
    [
      'run',
      '--frozen',
      'datamodel-codegen',
      '--input',
      relative(fraudDir, bundled),
      '--input-file-type',
      'openapi',
      '--output-model-type',
      'pydantic_v2.BaseModel',
      '--target-python-version',
      '3.14',
      '--use-annotated',
      '--field-constraints',
      '--disable-timestamp',
      '--output',
      relative(fraudDir, pyFile),
    ],
    fraudDir,
  )
}

function orvalConfig(bundled, tsDir) {
  return {
    client: {
      input: { target: bundled },
      output: {
        target: join(tsDir, 'client.ts'),
        client: 'react-query',
        httpClient: 'fetch',
        mode: 'single',
        clean: false,
      },
    },
    zod: {
      input: { target: bundled },
      output: { target: join(tsDir, 'zod.ts'), client: 'zod', mode: 'single', clean: false },
    },
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generate({
    input: join(contractsDir, 'openapi.yaml'),
    tsDir: join(contractsDir, 'generated/ts'),
    goFile: join(repoRoot, 'services/dispatch/internal/contract/contract.gen.go'),
    goPackage: 'contract',
    pyFile: join(repoRoot, 'services/fraud/app/contract/models.py'),
  })
}
