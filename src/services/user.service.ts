import bcrypt from 'bcrypt'
import { Json } from '@athenna/common'
import { Service } from '@athenna/ioc'
import { User } from '#src/models/user'
import { NotFoundException } from '@athenna/http'

@Service()
export class UserService {
  public async getAll() {
    return User.findMany()
  }

  public async create(data: Partial<User>) {
    data.password = await bcrypt.hash(data.password, 10)

    return User.create(data)
  }

  public async getById(id: number) {
    const user = await User.query().where('id', id).find()

    if (!user) {
      throw new NotFoundException(`Not found any user with ${id} id.`)
    }

    return user
  }

  public async getByEmailSafe(email: string) {
    return User.query().where('email', email).find()
  }

  public async update(id: number, data: Partial<User>): Promise<User> {
    if (data.password) {
      data = Json.omit(data, ['password'])
    }

    return User.query().where('id', id).update(data)
  }

  public async delete(id: number) {
    return User.query().where('id', id).delete()
  }
}
