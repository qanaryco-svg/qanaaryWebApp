import type { NextApiRequest, NextApiResponse } from 'next'
import { fallbackRespond, ChatMessage } from '../../lib/chatbot'
import { logEvent } from '../../lib/chatLogger'

// optional Redis-based limiter
let redisClient: any = null
let RedisRateLimiter: any = null
try {
  if (process.env.REDIS_URL) {
    // lazy require so local dev without deps won't break
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const IORedis = require('ioredis')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { RateLimiterRedis } = require('rate-limiter-flexible')
    redisClient = new IORedis(process.env.REDIS_URL)
    RedisRateLimiter = new RateLimiterRedis({ storeClient: redisClient, keyPrefix: 'rlf', points: 20, duration: 60 })
  }
} catch (e) {
  // ignore require errors; fallback to in-memory limiter
}

type ApiReq = { messages: ChatMessage[] }

// Simple in-memory rate limiter per IP (suitable for single-instance dev/prod). For multi-instance use Redis or external store.
const RATE_WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20
const rateMap: Map<string, { count: number; windowStart: number }> = new Map()

function getIp(req: NextApiRequest) {
  const xff = req.headers['x-forwarded-for']
  if (typeof xff === 'string') return xff.split(',')[0].trim()
  // fallback to socket remoteAddress
  return (req.socket && req.socket.remoteAddress) ? String(req.socket.remoteAddress) : 'unknown'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const body: ApiReq = req.body
  if (!body || !Array.isArray(body.messages)) return res.status(400).json({ error: 'invalid body' })

  // rate-limit check: prefer Redis if configured
  try {
    const ip = getIp(req)
    if (RedisRateLimiter) {
      try {
        await RedisRateLimiter.consume(ip)
      } catch (rlErr: any) {
        const retryAfter = Math.ceil((rlErr.msBeforeNext || 0) / 1000)
        logEvent({ type: 'rate_limited', ip, via: 'redis', retryAfter })
        res.setHeader('Retry-After', String(retryAfter))
        return res.status(429).json({ ok: false, error: 'rate_limited', retryAfter })
      }
    } else {
      const now = Date.now()
      const entry = rateMap.get(ip)
      if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
        rateMap.set(ip, { count: 1, windowStart: now })
      } else {
        entry.count += 1
        if (entry.count > MAX_REQUESTS_PER_WINDOW) {
          const retryAfter = Math.ceil((entry.windowStart + RATE_WINDOW_MS - now) / 1000)
          logEvent({ type: 'rate_limited', ip, via: 'memory', retryAfter })
          res.setHeader('Retry-After', String(retryAfter))
          return res.status(429).json({ ok: false, error: 'rate_limited', retryAfter })
        }
        rateMap.set(ip, entry)
      }
    }
  } catch (e) {
    // If rate limiting fails unexpectedly, continue (fail-open)
  }

  const key = process.env.OPENAI_API_KEY
  if (!key) {
    // fallback
    const text = fallbackRespond(body.messages)
    return res.status(200).json({ ok: true, model: 'fallback', text })
  }

  // Proxy to OpenAI chat completions (simple implementation)
  try {
    // insert a helpful Persian system prompt to guide responses
    const systemPrompt = {
      role: 'system',
      content: 'شما یک دستیار فروشگاهی به زبان فارسی هستید. لحن دوستانه و رسمی داشته باشید، کوتاه و مفید پاسخ دهید، و در صورت نیاز کاربر را به صفحات فروشگاه راهنمایی کنید.'
    }
    const messagesToSend = [systemPrompt, ...body.messages.map(m => ({ role: m.role, content: m.content }))]

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: process.env.CHAT_MODEL || 'gpt-3.5-turbo',
        messages: messagesToSend,
        max_tokens: 600
      })
    })

    if (!resp.ok) {
      const txt = await resp.text()
      // try fallback
      const fallback = fallbackRespond(body.messages)
      return res.status(200).json({ ok: false, error: txt, fallback })
    }

    const data = await resp.json()
    const answer = data.choices?.[0]?.message?.content || ''
    return res.status(200).json({ ok: true, model: process.env.CHAT_MODEL || 'gpt-3.5-turbo', text: answer })
  } catch (e: any) {
    const fallback = fallbackRespond(body.messages)
    return res.status(500).json({ ok: false, error: String(e?.message || e), fallback })
  }
}
