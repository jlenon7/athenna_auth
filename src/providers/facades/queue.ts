import { Facade } from '@athenna/ioc'
import type { QueueImpl } from '#src/helpers/queue'

export const Queue = Facade.createFor<QueueImpl>('App/Helpers/Queue')
