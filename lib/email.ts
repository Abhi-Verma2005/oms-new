import nodemailer from 'nodemailer'

export interface SendEmailOptions {
  to: string
  subject: string
  html?: string
  text?: string
}

let cachedTransporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (cachedTransporter) return cachedTransporter
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) {
    throw new Error('SMTP configuration missing (SMTP_HOST, SMTP_USER, SMTP_PASS)')
  }
  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
  return cachedTransporter
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const from = process.env.EMAIL_FROM || 'noreply@example.com'
  const transporter = getTransporter()
  await transporter.sendMail({ from, to, subject, html, text })
}


