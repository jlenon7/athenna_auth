import { Mail } from '@athenna/mail'
import type { User } from '#src/models/user'
import { Worker, BaseWorker } from '@athenna/queue'

type Job = {
  view: string
  subject: string
  user: User
  email: string
  password: string
  token: string
}

@Worker()
export class MailWorker extends BaseWorker {
  public static queue() {
    return 'mail'
  }

  public async handle(data: Job): Promise<void> {
    await Mail.from('noreply@athenna.io')
      .to(data.user.email)
      .subject(data.subject)
      .view(data.view, {
        user: data.user,
        email: data.email,
        password: data.password,
        token: data.token
      })
      .send()
  }
}
