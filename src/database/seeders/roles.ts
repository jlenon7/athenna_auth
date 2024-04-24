import { BaseSeeder, type DatabaseImpl } from '@athenna/database'

export class Roles extends BaseSeeder {
  public async run(db: DatabaseImpl) {
    await db.table('roles').createMany([
      {
        name: 'Admin'
      },
      {
        name: 'Customer'
      }
    ])
  }
}
