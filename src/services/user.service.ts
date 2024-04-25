import { Service } from '@athenna/ioc'
import { User } from '#src/models/user'
import { Role } from '#src/models/role'
import { RoleUser } from '#src/models/roleuser'
import { RoleEnum } from '#src/enums/role.enum'
import { NotFoundException } from '@athenna/http'
import { Json, type PaginationOptions } from '@athenna/common'

@Service()
export class UserService {
  public async getAll(pagination: PaginationOptions = {}) {
    return User.paginate(pagination)
  }

  public async create(data: Partial<User>) {
    const user = await User.create(data)
    const role = await Role.find({ name: RoleEnum.CUSTOMER })

    await RoleUser.create({ userId: user.id, roleId: role.id })

    return user
  }

  public async getById(id: number) {
    const user = await User.query().where('id', id).find()

    if (!user) {
      throw new NotFoundException(`Not found any user with id ${id}.`)
    }

    return user
  }

  public async getByEmail(email: string) {
    const user = await User.query().where('email', email).find()

    if (!user) {
      throw new NotFoundException(`Not found any user with email ${email}.`)
    }

    return user
  }

  public async update(id: number, data: Partial<User>): Promise<User> {
    data = Json.omit(data, ['email', 'password'])

    const user = await User.query().where('id', id).update(data)

    return user as User
  }

  public async delete(id: number) {
    return User.query().where('id', id).delete()
  }
}
