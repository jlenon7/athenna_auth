import { Mail } from '@athenna/mail'
import { Log } from '@athenna/logger'
import { ServiceProvider } from '@athenna/ioc'
import { Queue } from '#src/providers/facades/queue'

export default class QueueWorkerProvider extends ServiceProvider {
  public intervals = []

  public async boot() {
    this.processByQueue('user:register', async user => {
      return Mail.from('noreply@athenna.io')
        .to(user.email)
        .subject('Athenna Account Activation')
        .view('mail/register', { user })
        .send()
    })
  }

  public async shutdown() {
    this.intervals.forEach(interval => clearInterval(interval))
  }

  public processByQueue(queueName: string, processor: any) {
    const interval = setInterval(async () => {
      const queue = await Queue.queue(queueName)

      if (await queue.isEmpty()) {
        return
      }

      Log.info(`Processing jobs of ({yellow} "${queueName}") queue`)

      await queue.process(processor)

      const jobsLength = await queue.length()

      if (jobsLength) {
        Log.info(
          `Still has ({yellow} ${jobsLength}) jobs to process on ({yellow} "${queueName}")`
        )
      }
    }, 5000)

    this.intervals.push(interval)
  }
}
