import bcrypt from 'bcrypt'
import { Json } from '@athenna/common'
import { Service } from '@athenna/ioc'
import { User } from '#src/models/user'
import { Role } from '#src/models/role'
import { RoleUser } from '#src/models/roleuser'
import { NotFoundException } from '@athenna/http'

@Service()
export class UserService {
  public async getAll() {
    return User.query().findMany()
  }

  public async create(data: Partial<User>) {
    data.password = await bcrypt.hash(data.password, 10)

    const user = await User.create(data)
    const role = await Role.find({ name: 'Customer' })

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
    if (data.password) {
      data = Json.omit(data, ['password'])
    }

    const user = await User.query().where('id', id).update(data)

    return user as User
  }

  public async delete(id: number) {
    return User.query().where('id', id).delete()
  }
}
