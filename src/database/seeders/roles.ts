import { RoleEnum } from '#src/enums/role.enum'
import { BaseSeeder, type DatabaseImpl } from '@athenna/database'

export class Roles extends BaseSeeder {
  public async run(db: DatabaseImpl) {
    await db.table('roles').createMany([
      {
        name: RoleEnum.ADMIN
      },
      {
        name: RoleEnum.CUSTOMER
      }
    ])
  }
}
