import express from 'express'
import fetch from 'node-fetch'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LMU_URL = process.env.LMU_URL || 'http://localhost:6397'
const PORT = process.env.PORT || 3002

const app = express()
app.use(express.json())

app.get('/', (req, res) => res.sendFile(join(__dirname, '../frontend/lmu-ffb.html')))

app.get('/api/lmu/controls', async (req, res) => {
  try {
    const r = await fetch(`${LMU_URL}/rest/options/UIScreen/Controls`)
    if (!r.ok) return res.status(r.status).json({ error: 'LMU error' })
    res.json(await r.json())
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

app.post('/api/lmu/setControls', async (req, res) => {
  try {
    const r = await fetch(`${LMU_URL}/rest/options/setControls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    })
    if (!r.ok) return res.status(r.status).json({ error: 'LMU error' })
    res.json({})
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

app.post('/api/lmu/center', async (req, res) => {
  try {
    const liveR = await fetch(`${LMU_URL}/rest/options/liveInputs`)
    if (!liveR.ok) throw new Error('liveInputs failed')
    const live = await liveR.json()

    const currentPos = live?.liveInputs?.di?.[0]?.['raw inputs']?.steerLeft
    if (currentPos == null) return res.status(502).json({ error: 'No steering data' })

    // Safety: reject if more than 85° off center (900° wheel → half=450° → 85/450=0.189)
    if (Math.abs(currentPos - 0.5) > 0.189) {
      return res.status(400).json({ error: 'Wheel too far from center (>85°)' })
    }

    const ctrlR = await fetch(`${LMU_URL}/rest/options/UIScreen/Controls`)
    if (!ctrlR.ok) throw new Error('Controls failed')
    const ctrl = await ctrlR.json()

    const devices = ctrl.allControls.directInput.Devices
    for (const dev of Object.values(devices)) {
      if (dev['instance name']?.includes('VNM Direct Drive') && dev['input axis properties']) {
        const ax = dev['input axis properties']
        if (ax['X+']) { ax['X+'].center = currentPos; ax['X+'].min = currentPos }
        if (ax['X-']) { ax['X-'].center = currentPos; ax['X-'].min = currentPos }
      }
    }

    const setR = await fetch(`${LMU_URL}/rest/options/setControls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ctrl),
    })
    if (!setR.ok) throw new Error('setControls failed')

    res.json({ ok: true, center: currentPos })
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LMU FFB Control running on http://0.0.0.0:${PORT}`)
  console.log(`LMU at ${LMU_URL}`)
})
