import { Role } from '#src/models/role'
import { BaseSeeder } from '@athenna/database'
import { RoleEnum } from '#src/enums/role.enum'

export class RoleSeeder extends BaseSeeder {
  public async run() {
    await Role.createMany([
      { name: RoleEnum.ADMIN },
      { name: RoleEnum.CUSTOMER }
    ])
  }
}
