import { Mail } from '@athenna/mail'
import type { User } from '#src/models/user'

type Item = {
  user: User
  email: string
  token: string
}

export class UserEmailJob {
  public static queue() {
    return 'user:email'
  }

  public async handle({ user, email, token }: Item) {
    await Mail.from('noreply@athenna.io')
      .to(user.email)
      .subject('Athenna Email Change')
      .view('mail/change-email', { user, email, token })
      .send()
  }
}
