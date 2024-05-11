import { Mail } from '@athenna/mail'
import { Log } from '@athenna/logger'
import { ServiceProvider } from '@athenna/ioc'
import { Queue } from '#src/providers/facades/queue'

export default class QueueWorkerProvider extends ServiceProvider {
  public intervals = []

  public async boot() {
    this.processByQueue('user:confirm', async user => {
      return Mail.from('noreply@athenna.io')
        .to(user.email)
        .subject('Athenna Account Confirmation')
        .view('mail/confirm', { user })
        .send()
    })

    this.processByQueue('user:email', async ({ user, token, email }) => {
      return Mail.from('noreply@athenna.io')
        .to(user.email)
        .subject('Athenna Email Change')
        .view('mail/change-email', { user, email, token })
        .send()
    })

    this.processByQueue('user:password', async ({ user, token, password }) => {
      return Mail.from('noreply@athenna.io')
        .to(user.email)
        .subject('Athenna Password Change')
        .view('mail/change-password', { user, password, token })
        .send()
    })

    this.processByQueue(
      'user:email:password',
      async ({ user, token, email, password }) => {
        return Mail.from('noreply@athenna.io')
          .to(user.email)
          .subject('Athenna Email & Password Change')
          .view('mail/change-email-password', { user, email, password, token })
          .send()
      }
    )
  }

  public async shutdown() {
    this.intervals.forEach(interval => clearInterval(interval))
  }

  public processByQueue(
    queueName: string,
    processor: (data: any) => any | Promise<any>
  ) {
    const interval = setInterval(async () => {
      const queue = Queue.queue(queueName)

      if (queue.isEmpty()) {
        return
      }

      Log.info(`Processing jobs of ({yellow} "${queueName}") queue`)

      await queue.process(processor)

      const jobsLength = queue.length()

      if (jobsLength) {
        Log.info(
          `Still has ({yellow} ${jobsLength}) jobs to process on ({yellow} "${queueName}")`
        )
      }
    }, 5000)

    this.intervals.push(interval)
  }
}
