import { Mailsac } from '@mailsac/api'
const EMAIL_CHECK_TIMEOUT = 1000
const MAX_EMAIL_CHECK = 16
const EMAIL_APPROVE_BUTTON_TEXT = 'Approve this login'
const APPROVE_URL_REGEX = /https:\/\/register.*/u
const OTP_CODE_REGEX = /\d{3}\s?\d{3}/u
const AVAILABLE_MAILSAC_ADDRESSES = 10

export class Email {
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  private readonly mailsac: Mailsac<any>
  constructor(public readonly apiKey: string) {
    this.mailsac = new Mailsac({ headers: { 'Mailsac-Key': apiKey } })
  }

  async deleteAllMessages(email: string) {
    return await this.mailsac.messages.deleteAllMessages(email)
  }

  timeout(ms: number) {
    return new Promise(resolve => {
      setTimeout(resolve, ms)
    })
  }

  async getLatestMessageId(email: string): Promise<string> {
    let checks = 0
    /* eslint-disable no-await-in-loop */
    while (checks < MAX_EMAIL_CHECK) {
      const messages = await this.mailsac.messages.listMessages(email)
      if (messages.data.length > 0) {
        const message = messages.data[0]
        if (!message) {
          throw new Error('No message found')
        }
        const id = message._id
        if (!id) {
          throw new Error('Message ID not present')
        }

        return id
      }
      await this.timeout(EMAIL_CHECK_TIMEOUT)
      checks += 1
    }
    throw new Error('No email found')
  }

  async getEmailBody(email: string, messageId: string): Promise<string> {
    const result = await this.mailsac.messages.getBodyPlainText(email, messageId)

    return result.data
  }

  isApproveEmail(body: string): boolean {
    return body.includes(EMAIL_APPROVE_BUTTON_TEXT)
  }

  getApproveUrlFromBody(body: string): string {
    const match = body.match(APPROVE_URL_REGEX)
    if (match) {
      return match[0]
    }

    throw new Error(`No url found in email: ${body}`)
  }

  getOtpCodeFromBody(body: string): string {
    const match = body.match(OTP_CODE_REGEX)
    if (match) {
      return match[0]
    }

    throw new Error(`No code found in email: ${body}`)
  }

  getEmailAddressToUse(index: number): string {
    const maxIndex = AVAILABLE_MAILSAC_ADDRESSES - 1
    if (index > maxIndex) {
      throw new Error(
        `No available Mailsac address. Requested index ${index}, maximum: ${maxIndex}`
      )
    }

    return `web3modal${index}@mailsac.com`
  }

  getSmartAccountEnabledEmail(): string {
    return 'web3modal-smart-account@mailsac.com'
  }
}
