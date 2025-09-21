import { randomBytes } from "crypto"

export function generateSecret(): string {
  const secret = randomBytes(32)
  return base32Encode(secret)
}

export function generateBackupCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < 10; i++) {
    const code = randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
  }
  return codes
}

export function generateTOTP(secret: string, timeStep: number = 30): string {
  const time = Math.floor(Date.now() / 1000 / timeStep)
  const key = base32Decode(secret)
  const hmac = require('crypto').createHmac('sha1', key)
  hmac.update(Buffer.from(time.toString(16).padStart(16, '0'), 'hex'))
  const hash = hmac.digest()
  const offset = hash[hash.length - 1] & 0xf
  const code = ((hash[offset] & 0x7f) << 24) |
               ((hash[offset + 1] & 0xff) << 16) |
               ((hash[offset + 2] & 0xff) << 8) |
               (hash[offset + 3] & 0xff)
  return (code % 1000000).toString().padStart(6, '0')
}

export function verifyTOTP(token: string, secret: string, window: number = 1): boolean {
  const timeStep = 30
  const time = Math.floor(Date.now() / 1000 / timeStep)
  for (let i = -window; i <= window; i++) {
    const expectedToken = generateTOTP(secret, timeStep)
    if (expectedToken === token) return true
  }
  return false
}

function base32Encode(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let result = ''
  let bits = 0
  let value = 0
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i]
    bits += 8
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31]
  }
  return result
}

function base32Decode(str: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const lookup: { [key: string]: number } = {}
  for (let i = 0; i < alphabet.length; i++) lookup[alphabet[i]] = i
  let bits = 0
  let value = 0
  const result: number[] = []
  for (let i = 0; i < str.length; i++) {
    const char = str[i].toUpperCase()
    if (lookup[char] === undefined) continue
    value = (value << 5) | lookup[char]
    bits += 5
    if (bits >= 8) {
      result.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(result)
}
