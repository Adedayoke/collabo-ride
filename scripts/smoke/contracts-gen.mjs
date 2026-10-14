// Smoke test 2 (spec 0009): `contracts:gen` on a sample with nullable fields and
// oneOf must produce compiling TS, Go, and Python. Output goes to throwaway folders
// inside each language's project (so each toolchain can compile it) and is removed after.
import { execFileSync } from 'node:child_process'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generate } from '../../packages/contracts/scripts/gen.mjs'

const root = resolve(fileURLToPath(import.meta.url), '../../..')
const contracts = join(root, 'packages/contracts')
const tsDir = join(contracts, 'smoke/out')
const goDir = join(root, 'services/dispatch/internal/contractsmoke')
const pyDir = join(root, 'services/fraud/app/contractsmoke')

const dispatch = join(root, 'services/dispatch')
// The oneOf union needs github.com/oapi-codegen/runtime; the real contract does not
// use it yet, so go.mod and go.sum are restored after the check.
const goMod = readFileSync(join(dispatch, 'go.mod'))
const goSum = readFileSync(join(dispatch, 'go.sum'))
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
const results = []
const step = (label, fn) => {
  try {
    fn()
    results.push(`PASS  ${label}`)
  } catch {
    results.push(`FAIL  ${label}`)
    process.exitCode = 1
  }
}

try {
  generate({
    input: join(contracts, 'smoke/sample.yaml'),
    tsDir,
    goFile: join(goDir, 'contract.gen.go'),
    goPackage: 'contractsmoke',
    pyFile: join(pyDir, 'models.py'),
  })
  writeFileSync(join(pyDir, '__init__.py'), '')
  // Parse both oneOf branches and a null in a nullable field.
  writeFileSync(
    join(pyDir, 'check.py'),
    [
      'from app.contractsmoke import models as m',
      'card = m.Payment.model_validate({"id": "p1", "amountKobo": 500, "settledAt": None, "method": {"kind": "card", "last4": "4242"}})',
      'cash = m.Payment.model_validate({"id": "p2", "amountKobo": 900, "settledAt": "2026-10-14T10:00:00Z", "method": {"kind": "cash", "changeKobo": None}})',
      'assert card.settledAt is None and type(card.method.root if hasattr(card.method, "root") else card.method).__name__ == "CardMethod"',
      'assert type(cash.method.root if hasattr(cash.method, "root") else cash.method).__name__ == "CashMethod"',
    ].join('\n') + '\n',
  )
  writeFileSync(
    join(tsDir, 'tsconfig.json'),
    JSON.stringify({ extends: '../../tsconfig.json', include: ['.'], compilerOptions: { lib: ['ES2024', 'DOM'] } }),
  )

  step('TS compiles (orval client and Zod)', () => run('pnpm', ['exec', 'tsc', '-p', 'smoke/out'], contracts))
  step('Go compiles (oapi-codegen, from the 3.0 copy)', () => {
    run('go', ['get', 'github.com/oapi-codegen/runtime@v1.7.0'], dispatch)
    run('go', ['vet', './internal/contractsmoke'], dispatch)
  })
  step('Python imports and validates (Pydantic v2)', () =>
    run('uv', ['run', '--frozen', 'python', '-m', 'app.contractsmoke.check'], join(root, 'services/fraud')),
  )
} finally {
  for (const dir of [tsDir, goDir, pyDir]) rmSync(dir, { recursive: true, force: true })
  writeFileSync(join(dispatch, 'go.mod'), goMod)
  writeFileSync(join(dispatch, 'go.sum'), goSum)
}
console.log(results.join('\n'))
