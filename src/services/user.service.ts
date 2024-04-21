import bcrypt from 'bcrypt'
import { Service } from '@athenna/ioc'
import { User } from '#src/models/User'
import { UserNotFoundException } from '#src/exceptions/usernotfound.exception'

@Service()
export class UserService {
  public async getAll() {
    return User.findMany()
  }

  public async create(data: Partial<User>) {
    data.password = await bcrypt.hash(password, 10)

    return User.create(data)
  }

  public async getById(id: string) {
    const user = await User.query().where('id', id).find()

    if (!user) {
      throw new UserNotFoundException(`Not found any user with ${id} id.`)
    }

    return user
  }

  public async getByEmail(email: string) {
    return User.query().where('email', email).find()
  }

  public async update(id: string, data: Partial<User>) {
    return User.query().where('id', id).update(data)
  }

  public async delete(id: string) {
    return User.query().where('id', id).delete()
  }
}
