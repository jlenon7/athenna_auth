import jwt from 'jsonwebtoken'
import { User } from '#src/models/user'
import { Role } from '#src/models/role'
import { Config } from '@athenna/config'
import { RoleEnum } from '#src/enums/role.enum'
import { RoleUser } from '#src/models/roleuser'
import { BaseHttpTest } from '@athenna/core/testing/BaseHttpTest'

export class BaseE2ETest extends BaseHttpTest {
  public async getAdminToken() {
    return ioc.use('authService').login('admin@athenna.io', '12345')
  }

  public async getCustomerToken() {
    return ioc.use('authService').login('customer@athenna.io', '12345')
  }

  public createFakeToken(data: any) {
    return jwt.sign(data, Config.get('auth.jwt.secret'), {
      expiresIn: Config.get('auth.jwt.expiresIn')
    })
  }

  public async createToken(user: User) {
    return ioc.use('authService').login(user.email, '12345')
  }

  public async createAdmin() {
    const user = await User.factory().create()
    const role = await Role.find({ name: RoleEnum.ADMIN })

    await RoleUser.create({ userId: user.id, roleId: role.id })

    return user
  }

  public async createCustomer() {
    const user = await User.factory().create()
    const role = await Role.find({ name: RoleEnum.CUSTOMER })

    await RoleUser.create({ userId: user.id, roleId: role.id })

    return user
  }
}
