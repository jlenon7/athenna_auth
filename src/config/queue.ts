import { Env } from '@athenna/config'

export default {
  /*
  |--------------------------------------------------------------------------
  | Default Queue Connection Name
  |--------------------------------------------------------------------------
  |
  | Athenna's queue API supports an assortment of back-ends via a single
  | API, giving you convenient access to each back-end using the same
  | syntax for every one. Here you may define a default connection.
  |
  */

  default: Env('QUEUE_CONNECTION', 'vanilla'),

  /*
   |--------------------------------------------------------------------------
   | Queue Connections
   |--------------------------------------------------------------------------
   |
   | Here you may configure the connection information for each server that
   | is used by your application. A default configuration has been added
   | for each back-end shipped with Athenna. You are free to add more.
   |
   | Drivers: "vanilla", "database", "fake"
   |
   */

  connections: {
    vanilla: {
      driver: 'vanilla',
      queue: 'default',
      workerInterval: 5000,
      deadletter: 'deadletter'
    },

    database: {
      driver: 'database',
      table: 'jobs',
      connection: 'postgres',
      queue: 'default',
      workerInterval: 1000,
      deadletter: 'deadletter'
    },

    discard: {
      driver: 'fake'
    },

    fake: {
      driver: 'fake'
    }
  }
}
