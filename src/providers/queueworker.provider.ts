import { Log } from '@athenna/logger'
import { ServiceProvider } from '@athenna/ioc'
import { Exec, Module } from '@athenna/common'

export default class QueueWorkerProvider extends ServiceProvider {
  public intervals = []

  public async boot() {
    const jobs = Config.get<string[]>('rc.jobs', [])

    await Exec.concurrently(jobs, async jobPath => {
      const Job = await Module.resolve(jobPath, import.meta.url)
      const alias = `App/Jobs/${Job.name}`

      const queueName = Job.queue()
      const job = this.container.transient(Job, alias).use(alias)

      const interval = setInterval(async () => {
        const queue = job.queue()

        if (queue.isEmpty()) {
          return
        }

        Log.info(`Processing jobs of ({yellow} "${queueName}") queue`)

        await queue.process(job.handle.bind(job))

        const jobsLength = queue.length()

        if (jobsLength) {
          Log.info(
            `Still has ({yellow} ${jobsLength}) jobs to process on ({yellow} "${queueName}")`
          )
        }
      }, 5000)

      this.intervals.push(interval)
    })
  }

  public async shutdown() {
    this.intervals.forEach(interval => clearInterval(interval))
  }
}
