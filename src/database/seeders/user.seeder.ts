import bcrypt from 'bcrypt'
import { Uuid } from '@athenna/common'
import { User } from '#src/models/user'
import { Role } from '#src/models/role'
import { BaseSeeder } from '@athenna/database'
import { RoleEnum } from '#src/enums/role.enum'
import { RoleUser } from '#src/models/roleuser'

export class UserSeeder extends BaseSeeder {
  public async run() {
    const userAdmin = await User.create({
      name: 'Admin',
      email: 'admin@athenna.io',
      password: await bcrypt.hash('12345', 10),
      token: Uuid.generate(),
      emailVerifiedAt: new Date()
    })

    const userCustomer = await User.create({
      name: 'Customer',
      email: 'customer@athenna.io',
      password: await bcrypt.hash('12345', 10),
      token: Uuid.generate(),
      emailVerifiedAt: new Date()
    })

    const roleAdmin = await Role.find({ name: RoleEnum.ADMIN })
    const roleCustomer = await Role.find({ name: RoleEnum.CUSTOMER })

    await RoleUser.createMany([
      { userId: userAdmin.id, roleId: roleAdmin.id },
      { userId: userCustomer.id, roleId: roleCustomer.id }
    ])
  }
}
