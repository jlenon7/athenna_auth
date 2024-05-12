import { Mail } from '@athenna/mail'
import type { User } from '#src/models/user'
import { BaseJob } from '#src/jobs/base.job'

type Item = {
  view: string
  subject: string
  user: User
  email: string
  password: string
  token: string
}

export class MailJob extends BaseJob {
  public static queue() {
    return 'mail'
  }

  public async handle(item: Item) {
    await Mail.from('noreply@athenna.io')
      .to(item.user.email)
      .subject(item.subject)
      .view(item.view, {
        user: item.user,
        email: item.email,
        password: item.password,
        token: item.token
      })
      .send()
  }
}
