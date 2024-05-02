import { Log } from '@athenna/logger'
import { Service } from '@athenna/ioc'
import { File, Path } from '@athenna/common'

class VanillaQueue<T = any> {
  private queueName = 'default'

  private getFile() {
    const path = Path.storage('queues.json')

    return new File(path, JSON.stringify({ default: [], deadletter: [] }))
  }

  public async truncate() {
    const path = Path.storage('queues.json')

    return new File(path, '').setContent(
      JSON.stringify({ default: [], deadletter: [] })
    )
  }

  public async queue(name: string) {
    const file = this.getFile()
    const queues = file.getContentAsJsonSync()

    this.queueName = name

    if (!queues[name]) {
      queues[name] = []
    }

    file.setContentSync(JSON.stringify(queues))

    return this
  }

  public async add(item: T) {
    const file = this.getFile()
    const queues = file.getContentAsJsonSync()

    queues[this.queueName].push(item)

    file.setContentSync(JSON.stringify(queues))

    return this
  }

  public async pop() {
    const file = this.getFile()
    const queues = file.getContentAsJsonSync()

    if (!queues[this.queueName].length) {
      return null
    }

    const item = queues[this.queueName].shift()

    file.setContentSync(JSON.stringify(queues))

    return item
  }

  public async peek() {
    const file = this.getFile()
    const queues = file.getContentAsJsonSync()

    if (!queues[this.queueName].length) {
      return null
    }

    return queues[this.queueName][0]
  }

  public async length() {
    const file = this.getFile()
    const queues = file.getContentAsJsonSync()

    return queues[this.queueName].length
  }

  public async process(processor: (item: T) => any | Promise<any>) {
    const data = await this.pop()

    try {
      await processor(data)
    } catch (err) {
      console.log(err)
      Log.error(
        `Adding data of ({yellow} "${this.queueName}") to deadletter queue due to:`,
        err
      )

      const queue = await new QueueImpl().queue('deadletter')

      await queue.add({ queue: this.queueName, data })
    }
  }

  public async isEmpty() {
    const file = this.getFile()
    const queues = file.getContentAsJsonSync()

    return !queues[this.queueName].length
  }
}

@Service({ alias: 'App/Helpers/Queue' })
export class QueueImpl<T = any> {
  public driver = new VanillaQueue<T>()

  public async truncate() {
    await this.driver.truncate()

    return this
  }

  public async queue(name: string) {
    await this.driver.queue(name)

    return this
  }

  public async add(item: T) {
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

  public async process(cb: (item: T) => any | Promise<any>) {
    return this.driver.process(cb)
  }

  public async isEmpty() {
    return this.driver.isEmpty()
  }
}
