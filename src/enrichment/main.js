require('module-alias/register')
const express = require('express')
const bodyParser = require('body-parser')
const config = require('@config/resolveConfig').lake || {}
const dispatch = require('./dispatch')

const app = express()
app.use(bodyParser.json())

const port = process.env.ENRICHMENT_PORT || 3000
const host = process.env.ENRICHMENT_HOST || 'localhost'

app.get('/', async (req, res) => {
  res.send("Let's enrich!")
})

app.post('/', async (req, res) => {
  if (config.token && req.headers['x-token'] !== config.token) {
    return res.status(401).json({ message: 'UNAUTHORIZED: Please provide a token >>> x-token: myToken' })
  }

  await dispatch.createJob(req.body)
  res.status(200).send(req.body)
})

app.listen(port, host, () => {
  console.log(`Enrichment API listening at http://${host}:${port}`)
})
