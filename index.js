import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import express from 'express'
import chalk from 'chalk'
import dotenv from 'dotenv'

dotenv.config()

// 🌐 Web server (Render needs this)
const app = express()
const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('💀 RIOT MD IS ONLINE')
})

app.listen(PORT, () => console.log(chalk.green(`Web running on ${PORT}`)))

// 🤖 WhatsApp Bot
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./sessions')

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: ['RIOT MD', 'Chrome', '1.0.0']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) console.log(chalk.yellow('QR RECEIVED'))

    if (connection === 'open') {
      console.log(chalk.green('💀 RIOT MD CONNECTED'))
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      if (shouldReconnect) startBot()
    }
  })

  // Test command
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ''

    const prefix = process.env.PREFIX || '.'
    if (!text.startsWith(prefix)) return

    const command = text.slice(prefix.length).toLowerCase()

    if (command === 'ping') {
      await sock.sendMessage(msg.key.remoteJid, {
        text: '🏓 Pong! RIOT MD live on Render 💀🔥'
      })
    }
  })
}

startBot()

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)
