import { Queue } from '#src/providers/facades/queue'

export class BaseJob {
  public static connection() {
    return 'default'
  }

  public static queue() {
    const connection = this.connection()

    return Config.get(`queue.connections.${connection}.queue`)
  }

  public queue() {
    const Job = this.constructor as typeof BaseJob

    return Queue.connection(Job.connection()).queue(Job.queue())
  }
}
