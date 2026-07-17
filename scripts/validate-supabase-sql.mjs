import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

const directory = path.join(process.cwd(), 'supabase')
const files = fs.readdirSync(directory).filter((file) => file.endsWith('.sql')).sort()
let functionsChecked = 0

for (const file of files) {
  const source = fs.readFileSync(path.join(directory, file), 'utf8')
  const dollarDelimiters = source.match(/\$[A-Za-z0-9_]*\$/g) || []
  assert.equal(dollarDelimiters.length % 2, 0, `${file}: unmatched dollar-quote delimiter`)

  const functionPattern = /create\s+or\s+replace\s+function\b[\s\S]*?\$\$[\s\S]*?\$\$\s*;/gi
  for (const match of source.matchAll(functionPattern)) {
    const definition = match[0]
    functionsChecked += 1
    if (!/language\s+plpgsql/i.test(definition)) continue

    const body = definition.slice(definition.indexOf('$$') + 2, definition.lastIndexOf('$$'))
    const declareIndex = body.search(/\bdeclare\b/i)
    const beginIndex = body.search(/\bbegin\b/i)
    assert.ok(beginIndex >= 0, `${file}: PL/pgSQL function is missing BEGIN`)

    const typedInitializer = /^\s*[a-zA-Z_][a-zA-Z0-9_.]*\s+(?:text|uuid|integer|bigint|numeric|date|timestamptz|boolean|jsonb|public\.[a-zA-Z_][a-zA-Z0-9_]*)\s*:=/gmi
    for (const initializer of body.matchAll(typedInitializer)) {
      assert.ok(declareIndex >= 0 && initializer.index > declareIndex && initializer.index < beginIndex,
        `${file}: typed := declaration appears outside DECLARE: ${initializer[0].trim()}`)
    }

    let balance = 0
    const scrubbed = body
      .replace(/--.*$/gm, '')
      .replace(/'(?:''|[^'])*'/g, "''")
    for (const character of scrubbed) {
      if (character === '(') balance += 1
      if (character === ')') balance -= 1
      assert.ok(balance >= 0, `${file}: unexpected closing parenthesis in function body`)
    }
    assert.equal(balance, 0, `${file}: mismatched parentheses in function body`)
  }
}

console.log(`Supabase SQL static validation passed: ${files.length} files, ${functionsChecked} functions.`)
