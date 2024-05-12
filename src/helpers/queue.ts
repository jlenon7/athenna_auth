import { Log } from '@athenna/logger'
import { Service } from '@athenna/ioc'
import { Database, type DatabaseImpl } from '@athenna/database'

class VanillaQueue {
  public connection: string
  private queueName = 'default'
  private queues: Record<string, any[]> = {
    default: [],
    deadletter: []
  }

  public constructor(connection: string) {
    this.connection = connection
  }

  public async truncate() {
    Object.keys(this.queues).forEach(key => (this.queues[key] = []))
  }

  public queue(name: string) {
    this.queueName = name

    if (!this.queues[name]) {
      this.queues[name] = []
    }

    return this
  }

  public async add(item: unknown) {
    this.queues[this.queueName].push(item)

    return this
  }

  public async pop() {
    if (!this.queues[this.queueName].length) {
      return null
    }

    return this.queues[this.queueName].shift()
  }

  public async peek() {
    if (!this.queues[this.queueName].length) {
      return null
    }

    return this.queues[this.queueName][0]
  }

  public async length() {
    return this.queues[this.queueName].length
  }

  public async isEmpty() {
    return !this.queues[this.queueName].length
  }

  public async process(processor: (item: unknown) => any | Promise<any>) {
    const data = await this.pop()

    try {
      await processor(data)
    } catch (err) {
      Log.error(
        `Adding data of ({yellow} "${this.queueName}") to deadletter queue due to:`,
        err
      )

      this.queues.deadletter.push({ queue: this.queueName, data })
    }
  }
}

class DatabaseQueue {
  private DB: DatabaseImpl
  private dbConnection: string

  private table: string
  private queueName: string
  private connection: string
  private deadLetterQueueName: string

  public constructor(connection: string) {
    const {
      table,
      queue,
      deadletter,
      connection: dbConnection
    } = Config.get(`database.connections.${connection}`)

    this.table = table
    this.queueName = queue
    this.connection = connection
    this.dbConnection = dbConnection
    this.deadLetterQueueName = deadletter

    this.DB = Database.connection(this.dbConnection)
  }

  public async truncate() {
    await this.DB.truncate(this.table)
  }

  public queue(name: string) {
    this.queueName = name

    return this
  }

  public async add(item: unknown) {
    await this.DB.table(this.table).create({
      queue: this.queueName,
      item
    })

    return this
  }

  public async pop() {
    const data = await this.DB.table(this.table)
      .where('queue', this.queueName)
      .orderBy('id', 'DESC')
      .find()

    if (!data) {
      return
    }

    await this.DB.table(this.table)
      .where('id', data.id)
      .where('queue', this.queueName)
      .delete()

    return data.item
  }

  public async peek() {
    const data = await this.DB.table(this.table)
      .where('queue', this.queueName)
      .orderBy('id', 'DESC')
      .find()

    if (!data) {
      return null
    }

    return data.item
  }

  public length() {
    return this.DB.table(this.table).where('queue', this.queueName).count()
  }

  public async process(processor: (item: unknown) => any | Promise<any>) {
    const data = await this.pop()

    try {
      await processor(data)
    } catch (err) {
      Log.error(
        `Adding data of ({yellow} "${this.queueName}") to deadletter queue due to:`,
        err
      )

      await this.DB.table(this.table).create({
        queue: this.deadLetterQueueName,
        formerQueue: this.queueName,
        item: data
      })
    }
  }

  public async isEmpty() {
    const count = await this.DB.table(this.table)
      .where('queue', this.queueName)
      .count()

    return count === '0'
  }
}

@Service({ alias: 'App/Helpers/Queue', type: 'singleton' })
export class QueueImpl {
  public driver: any = new VanillaQueue('vanilla')

  public connection(name: string) {
    if (name === 'vanilla' || name === 'default') {
      this.driver = new VanillaQueue('vanilla')
    }

    if (name === 'database') {
      this.driver = new DatabaseQueue('queue')
    }

    return this
  }

  public async truncate() {
    await this.driver.truncate()

    return this
  }

  public queue(name: string) {
    this.driver.queue(name)

    return this
  }

  public async add(item: unknown) {
    await this.driver.add(item)
  }

  public async pop() {
    return this.driver.pop()
  }

  public async peek() {
    return this.driver.peek()
  }

  public async length() {
    return this.driver.length()
  }

  public async process(cb: (item: unknown) => any | Promise<any>) {
    return this.driver.process(cb)
  }

  public async isEmpty() {
    return this.driver.isEmpty()
  }
}
