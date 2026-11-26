// Parse characters in context. A delimiter or newline inside quotes is data, not a boundary.
export const LIMITS = { bytes: 2 * 1024 * 1024, rows: 20000, cells: 250000 }
// The small synchronous API and the responsive UI use the same parser.
function finish(steps) { let part; do { part = steps.next() } while (!part.done); return part.value }
export function parseCSV(input, delimiter = ',') { return finish(parseSteps(input, delimiter)) }
export function* parseSteps(input, delimiter = ',') {
  if (typeof input !== 'string' || input.length > LIMITS.bytes) throw new Error('CSV exceeds the processing limit')
  if (![',', ';', '\t', '|'].includes(delimiter)) throw new Error('Choose a supported delimiter')
  const text = input.replace(/^\uFEFF/, '')
  if (!text.length) return []
  const rows = []
  let row = [], field = '', state = 'start', cells = 0
  function pushField() { row.push(field); field = ''; cells++; if (cells > LIMITS.cells) throw new Error('CSV exceeds the cell limit') }
  function pushRow() { pushField(); rows.push(row); row = []; if (rows.length > LIMITS.rows) throw new Error('CSV exceeds the row limit') }
  for (let i = 0; i < text.length; i++) {
    if ((i & 16383) === 0) yield i
    const c = text[i]
    if (state === 'quoted') {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else state = 'closed'
      } else field += c
      continue
    }
    if (state === 'closed' && c !== delimiter && c !== '\r' && c !== '\n') throw new Error('Unexpected content after a closing quote near character ' + (i + 1))
    if (c === delimiter) { pushField(); state = 'start' }
    else if (c === '\r' || c === '\n') { pushRow(); state = 'start'; if (c === '\r' && text[i + 1] === '\n') i++ }
    else if (c === '"') { if (state !== 'start') throw new Error('Unexpected quote near character ' + (i + 1)); state = 'quoted' }
    else { field += c; state = 'plain' }
  }
  if (state === 'quoted') throw new Error('Unclosed quoted field')
  if (row.length || field.length || state !== 'start') pushRow()
  return rows
}
export function detectDelimiter(text) { return finish(delimiterSteps(text)) }
export function* delimiterSteps(text) {
  const candidates = []
  for (const delimiter of [',', ';', '\t', '|']) {
    try {
      const rows = (yield* parseSteps(text, delimiter)).filter(row => row.some(cell => cell.length))
      if (!rows.length) continue
      const width = rows[0].length
      if (width > 1 && rows.every(row => row.length === width)) candidates.push(delimiter)
    } catch (_) { /* An explicit delimiter selection will show the detailed parse error. */ }
  }
  if (candidates.length !== 1) throw new Error('Delimiter is ambiguous or rows are irregular. Select a delimiter explicitly.')
  return candidates[0]
}
export const formulaLike = value => /^[\t\r]/.test(value) || /^[\s]*[=+@-]/.test(value)
export function cleanRows(rows, options) { return finish(cleanSteps(rows, options)) }
export function* cleanSteps(rows, options) {
  const output = [], seen = new Set()
  const changes = [], originalRows = []
  let emptyRemoved = 0, duplicatesRemoved = 0, protectedCells = 0
  for (let index = 0; index < rows.length; index++) {
    if ((index & 127) === 0) yield index
    const source = rows[index]
    let row = source.map(cell => options.trim ? cell.trim() : cell)
    if (index === 0 && options.header) row = row.map(cell => cell.trim().replace(/\s+/g, ' '))
    if (index > 0 && options.empty && row.every(cell => cell === '')) { emptyRemoved++; changes.push('Blank row removed'); continue }
    const key = JSON.stringify(row)
    if (index > 0 && options.dedupe && seen.has(key)) { duplicatesRemoved++; changes.push('Duplicate removed'); continue }
    if (index > 0) seen.add(key)
    if (options.protect) row = row.map(cell => { if (!formulaLike(cell)) return cell; protectedCells++; return "'" + cell })
    changes.push(row.some((cell, i) => cell !== source[i]) ? 'Edited' : 'Unchanged')
    originalRows.push(index + 1)
    output.push(row)
  }
  return { rows: output, emptyRemoved, duplicatesRemoved, protectedCells, changes, originalRows }
}
export function serializeCSV(rows, delimiter, separator = '\r\n') {
  return rows.map(row => row.map(cell => /["\r\n]/.test(cell) || cell.includes(delimiter) ? '"' + cell.replace(/"/g, '""') + '"' : cell).join(delimiter)).join(separator) + (rows.length ? separator : '')
}
