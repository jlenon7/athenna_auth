import bcrypt from 'bcrypt'
import { Service } from '@athenna/ioc'
import { User } from '#src/models/user'
import { Role } from '#src/models/role'
import { Queue } from '@athenna/queue'
import type { Token } from '#src/models/token'
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

  public async getByToken(token: Token) {
    const user = await User.query().where('id', token.userId).find()

    if (!user) {
      throw new NotFoundException(
        `Not found any user with token ${token.token}.`
      )
    }

    return user
  }

  public async update(id: number, data: Partial<User>): Promise<User> {
    const user = await this.getById(id)

    const isEmailEqual = user.isEmailEqual(data.email)
    const isPasswordEqual = user.isPasswordEqual(data.password)

    switch (`${isEmailEqual}:${isPasswordEqual}`) {
      case 'false:true':
        await Queue.queue('mail').add({
          user,
          token: await user.resetEmailToken(data.email),
          view: 'mail/reset_email',
          subject: 'Athenna Email Change'
        })

        break
      case 'true:false':
        await Queue.queue('mail').add({
          user,
          view: 'mail/reset_password',
          subject: 'Athenna Email Change',
          token: await user.resetPasswordToken(
            await bcrypt.hash(data.password, 10)
          )
        })

        break
      case 'false:false':
        await Queue.queue('mail').add({
          user,
          view: 'mail/reset_email_password',
          subject: 'Athenna Email & Password Change',
          token: await user.resetEmailPasswordToken(
            data.email,
            await bcrypt.hash(data.password, 10)
          )
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
