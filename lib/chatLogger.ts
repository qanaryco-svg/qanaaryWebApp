import fs from 'fs'
import path from 'path'

const LOG_PATH = process.env.CHAT_LOG_PATH || path.join(process.cwd(), 'chat.log')
const ENABLE_LOG = process.env.CHAT_LOG_ENABLED === '1' || process.env.CHAT_LOG_ENABLED === 'true'

export function logEvent(obj: any) {
  if (!ENABLE_LOG) return
  try {
    const line = `[${new Date().toISOString()}] ${JSON.stringify(obj)}\n`
    fs.appendFileSync(LOG_PATH, line)
  } catch (e) {
    // swallow logging errors
  }
}
