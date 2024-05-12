import bcrypt from 'bcrypt'
import { Service } from '@athenna/ioc'
import { User } from '#src/models/user'
import { Role } from '#src/models/role'
import { RoleUser } from '#src/models/roleuser'
import { RoleEnum } from '#src/enums/role.enum'
import { NotFoundException } from '@athenna/http'
import { Json, type PaginationOptions } from '@athenna/common'
import { Queue } from '#src/providers/facades/queue'

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
        await Queue.connection('vanilla').queue('mail').add({
          user,
          token,
          email: data.email,
          view: 'mail/change-email',
          subject: 'Athenna Email Change'
        })

        break
      case 'true:false':
        // TODO create a password_resets table to save the password
        data.password = await bcrypt.hash(data.password, 10)

        await Queue.connection('vanilla').queue('mail').add({
          user,
          token,
          password: data.password,
          view: 'mail/change-password',
          subject: 'Athenna Email Change'
        })
        break
      case 'false:false':
        // TODO create a password_resets table to save the password
        data.password = await bcrypt.hash(data.password, 10)

        await Queue.connection('vanilla').queue('mail').add({
          user,
          token,
          email: data.email,
          password: data.password,
          view: 'mail/change-email-password',
          subject: 'Athenna Email & Password Change'
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
