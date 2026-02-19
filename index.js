// index.js - RIOT MD WhatsApp Bot
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import express from 'express'
import chalk from 'chalk'
import dotenv from 'dotenv'
import qrcode from 'qrcode'

dotenv.config()

// 🌐 Express server for Render / uptime
const app = express()
const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send(`<h1>💀 RIOT MD ONLINE</h1><p>Status: Running</p><p>Uptime: ${process.uptime().toFixed(0)}s</p>`)
})

app.listen(PORT, () => console.log(chalk.green(`Web server running on port ${PORT}`)))

// 🤖 Start WhatsApp bot
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./sessions')

  const sock = makeWASocket({
    auth: state,
    browser: ['RIOT MD', 'Chrome', '1.0.0']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    // 🔹 QR Handling
    if (qr) {
      try {
        const qrString = await qrcode.toString(qr, { type: 'terminal' })
        console.log(chalk.yellow('Scan the QR below:'))
        console.log(qrString)
      } catch (err) {
        console.log('Error generating QR:', err)
      }
    }

    // 🔹 Connection Status
    if (connection === 'open') {
      console.log(chalk.green('💀 RIOT MD CONNECTED!'))
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      console.log(chalk.red('Connection closed, reconnecting...'))
      if (shouldReconnect) startBot()
    }
  })

  // 🔹 Message Handler
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ''

    const prefix = process.env.PREFIX || '.'
    if (!text.startsWith(prefix)) return

    const command = text.slice(prefix.length).trim().toLowerCase()

    // ✅ TEST COMMAND
    if (command === 'ping') {
      await sock.sendMessage(msg.key.remoteJid, { text: '🏓 Pong! RIOT MD is working 💀🔥' })
    }

    // Add more commands here later
  })
}

// Start the bot
startBot()

// 🛡 Anti-crash
process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)
