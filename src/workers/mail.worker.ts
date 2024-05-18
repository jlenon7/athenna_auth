import { Mail } from '@athenna/mail'
import type { User } from '#src/models/user'
import { Worker, BaseWorker } from '@athenna/queue'

type Job = {
  view: string
  subject: string
  user: User
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
      .view(data.view, { user: data.user, token: data.token })
      .send()
  }
}
