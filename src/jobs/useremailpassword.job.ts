import { Mail } from '@athenna/mail'
import type { User } from '#src/models/user'

type Item = {
  user: User
  email: string
  password: string
  token: string
}

export class UserEmailPasswordJob {
  public static queue() {
    return 'user:email:password'
  }

  public async handle({ user, email, password, token }: Item) {
    await Mail.from('noreply@athenna.io')
      .to(user.email)
      .subject('Athenna Email & Password Change')
      .view('mail/change-email-password', { user, email, password, token })
      .send()
  }
}
