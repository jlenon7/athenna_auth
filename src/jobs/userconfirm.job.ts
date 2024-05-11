import { Mail } from '@athenna/mail'
import type { User } from '#src/models/user'

type Item = {
  user: User
}

export class UserConfirmJob {
  public static queue() {
    return 'user:confirm'
  }

  public async handle({ user }: Item) {
    await Mail.from('noreply@athenna.io')
      .to(user.email)
      .subject('Athenna Account Confirmation')
      .view('mail/confirm', { user })
      .send()
  }
}
