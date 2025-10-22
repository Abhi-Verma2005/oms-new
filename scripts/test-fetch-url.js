#!/usr/bin/env node
/*
  Usage:
    node scripts/test-fetch-url.js <URL>

  Tries multiple methods to download a URL and reports which work:
  - fetch (default TLS)
  - fetch with https.Agent({ rejectUnauthorized: false })
  - https.request (default TLS)
  - https.request with rejectUnauthorized: false
*/

const https = require('node:https')
const http = require('node:http')
const { URL } = require('node:url')

async function main() {
  const url = process.argv[2]
  if (!url) {
    console.error('Provide a URL: node scripts/test-fetch-url.js <URL>')
    process.exit(1)
  }

  const methods = [
    { name: 'fetch (default TLS)', fn: fetchDefault },
    { name: 'fetch (insecure TLS)', fn: fetchInsecure },
    { name: 'https.request (default TLS)', fn: httpsDefault },
    { name: 'https.request (insecure TLS)', fn: httpsInsecure },
  ]

  for (const { name, fn } of methods) {
    console.log(`\n==> Testing: ${name}`)
    const t0 = Date.now()
    try {
      const result = await fn(url)
      const dt = Date.now() - t0
      console.log('Status:', result.status)
      console.log('Content-Type:', result.contentType)
      console.log('Bytes:', result.bytes)
      console.log('Head (32b hex):', result.headHex)
      console.log('Time (ms):', dt)
      console.log('OK: true')
    } catch (err) {
      const dt = Date.now() - t0
      console.log('OK: false')
      console.log('Time (ms):', dt)
      console.log('Error:', err && (err.message || String(err)))
      if (err && err.code) console.log('Error code:', err.code)
    }
  }
}

async function fetchDefault(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  return summarize(res.status, res.headers.get('content-type') || '', buf)
}

async function fetchInsecure(url) {
  const agent = new https.Agent({ rejectUnauthorized: false })
  // Node 18+ fetch supports the agent option
  const res = await fetch(url, { agent })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  return summarize(res.status, res.headers.get('content-type') || '', buf)
}

function httpsDefault(urlStr) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr)
    const mod = u.protocol === 'http:' ? http : https
    const req = mod.request(u, (res) => collect(res, resolve, reject, res.statusCode, res.headers['content-type']))
    req.on('error', reject)
    req.end()
  })
}

function httpsInsecure(urlStr) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr)
    const mod = u.protocol === 'http:' ? http : https
    const req = mod.request({ ...u, rejectUnauthorized: false }, (res) => collect(res, resolve, reject, res.statusCode, res.headers['content-type']))
    req.on('error', reject)
    req.end()
  })
}

function collect(res, resolve, reject, status, contentType) {
  const chunks = []
  res.on('data', (d) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)))
  res.on('end', () => {
    const buf = Buffer.concat(chunks)
    resolve(summarize(status || 0, contentType || '', buf))
  })
  res.on('error', reject)
}

function summarize(status, contentType, buf) {
  const head = buf.subarray(0, 32)
  return {
    status,
    contentType,
    bytes: buf.length,
    headHex: head.toString('hex')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


