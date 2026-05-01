import express from 'express'
import Redis from 'ioredis'
import fetch from 'node-fetch'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json())
app.get('/', (req, res) => res.sendFile(join(__dirname, '../frontend/index-ui.html')))
app.get('/demo', (req, res) => res.sendFile(join(__dirname, '../demo/demo-ui.html')))

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
redis.on('error', (err) => console.error('Redis error:', err))

const LMU_URL = process.env.LMU_URL || 'http://localhost:6397'
const TTL = parseInt(process.env.TTL_SECONDS || '172800') // 48h

function buildKey(name) {
  return name.toLowerCase()
}

// ── PUSH: reads setup from local LMU and uploads to Redis ────────────────────
app.post('/api/push', async (req, res) => {
  const { sessionName } = req.body

  if (!sessionName || sessionName.length > 10 || !/^[a-zA-Z0-9]+$/.test(sessionName)) {
    return res.status(400).json({ error: 'Invalid name. Letters and numbers only, max 10 chars.' })
  }

  const key = buildKey(sessionName)

  // Check if already exists
  const exists = await redis.exists(key)
  if (exists) {
    return res.status(409).json({ error: `Session "${key}" already in use. Try another name.` })
  }

  // Read setup from local LMU
  let setupJson
  try {
    const lmuRes = await fetch(`${LMU_URL}/rest/garage/UIScreen/CarSetupOverview`)
    if (!lmuRes.ok) throw new Error(`LMU responded with ${lmuRes.status}`)
    setupJson = await lmuRes.json()
  } catch (err) {
    return res.status(502).json({ error: `Could not read LMU setup: ${err.message}` })
  }

  // Read metadata (car/circuit)
  let summary = {}
  try {
    const sumRes = await fetch(`${LMU_URL}/rest/garage/summary`)
    if (sumRes.ok) summary = await sumRes.json()
  } catch (_) {}

  const payload = {
    setupJson,
    summary,
    sessionName: key,
    createdAt: new Date().toISOString(),
  }

  await redis.set(key, JSON.stringify(payload), 'EX', TTL)

  res.json({ sessionId: key, expiresIn: TTL })
})

// ── PULL: downloads setup from Redis and sends to local LMU ──────────────────
app.post('/api/pull', async (req, res) => {
  const { sessionName } = req.body

  if (!sessionName || !/^[a-zA-Z0-9]+$/.test(sessionName)) {
    return res.status(400).json({ error: 'Invalid session name.' })
  }

  const key = buildKey(sessionName)
  const raw = await redis.get(key)

  if (!raw) {
    return res.status(404).json({ error: `Session "${key}" not found or expired.` })
  }

  const { setupJson, summary, createdAt } = JSON.parse(raw)

  // Send each garage value individually to LMU
  const garageValues = setupJson?.carSetup?.garageValues
  if (!garageValues) {
    return res.status(502).json({ error: 'Stored setup has no garageValues.' })
  }

  // GET current setup and only send values that differ
  let currentValues = {}
  try {
    const cur = await fetch(`${LMU_URL}/rest/garage/UIScreen/CarSetupOverview`)
    if (cur.ok) {
      const curJson = await cur.json()
      currentValues = curJson?.carSetup?.garageValues ?? {}
    }
  } catch (_) {}

  const changed = Object.entries(garageValues).filter(([key_param, val]) => {
    if (val.value === undefined || val.value === '') return false
    return currentValues[key_param]?.value !== val.value
  })

  const results = await Promise.all(
    changed.map(([key_param, val]) =>
      fetch(`${LMU_URL}/rest/garage/${key_param}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: val.value }),
      }).then(r => r.ok ? null : `${key_param}: ${r.status}`)
        .catch(err => `${key_param}: ${err.message}`)
    )
  )

  const errors = results.filter(Boolean)

  res.json({ ok: true, sessionId: key, summary, createdAt, changed: changed.length, errors: errors.length ? errors : undefined })
})

// ── Healthcheck ───────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await redis.ping()
    res.json({ status: 'ok', redis: 'connected' })
  } catch {
    res.status(500).json({ status: 'error', redis: 'disconnected' })
  }
})

const PORT = process.env.PORT || 8080
app.listen(PORT, '0.0.0.0', () => {
  console.log(`LMU Setup Sharing running on http://0.0.0.0:${PORT}`)
  console.log(`Pointing to LMU at ${LMU_URL}`)
})
