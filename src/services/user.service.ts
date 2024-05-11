import bcrypt from 'bcrypt'
import { Service } from '@athenna/ioc'
import { User } from '#src/models/user'
import { Role } from '#src/models/role'
import { RoleUser } from '#src/models/roleuser'
import { RoleEnum } from '#src/enums/role.enum'
import { NotFoundException } from '@athenna/http'
import { Queue } from '#src/providers/facades/queue'
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

  public async getByToken(token: string) {
    const user = await User.query().where('token', token).find()

    if (!user) {
      throw new NotFoundException(`Not found any user with token ${token}.`)
    }

    return user
  }

  public async update(id: number, data: Partial<User>): Promise<User> {
    const user = await this.getById(id)

    const token = user.token
    const isEmailEqual = user.isEmailEqual(data.email)
    const isPasswordEqual = user.isPasswordEqual(data.password)

    switch (`${isEmailEqual}:${isPasswordEqual}`) {
      case 'false:true':
        await Queue.queue('user:email').add({ user, token, email: data.email })
        break
      case 'true:false':
        data.password = await bcrypt.hash(data.password, 10)

        await Queue.queue('user:password').add({
          user,
          token,
          password: data.password
        })
        break
      case 'false:false':
        data.password = await bcrypt.hash(data.password, 10)

        await Queue.queue('user:email:password').add({
          user,
          token,
          email: data.email,
          password: data.password
        })
    }

    data = Json.omit(data, ['email', 'password'])

    const userUpdated = await User.query().where('id', id).update(data)

    return userUpdated as User
  }

  public async delete(id: number) {
    return User.delete({ id })
  }
}
