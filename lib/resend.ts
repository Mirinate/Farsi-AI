import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!)
}

export async function sendEmail({
  to,
  subject,
  html,
  from = 'Mirinate Care <noreply@mirinatecare.com>',
}: {
  to: string | string[]
  subject: string
  html: string
  from?: string
}) {
  return getResend().emails.send({ from, to, subject, html })
}
