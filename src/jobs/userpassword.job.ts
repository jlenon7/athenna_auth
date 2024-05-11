import { Mail } from '@athenna/mail'
import type { User } from '#src/models/user'

type Item = {
  user: User
  password: string
  token: string
}

export class UserPasswordJob {
  public static queue() {
    return 'user:password'
  }

  public async handle({ user, password, token }: Item) {
    await Mail.from('noreply@athenna.io')
      .to(user.email)
      .subject('Athenna Password Change')
      .view('mail/change-password', { user, password, token })
      .send()
  }
}
