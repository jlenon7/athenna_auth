import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Log } from '@athenna/logger'
import { Service } from '@athenna/ioc'
import { Config } from '@athenna/config'
import type { User } from '#src/models/user'
import { UnauthorizedException } from '@athenna/http'
import type { UserService } from '#src/services/user.service'

@Service()
export class AuthService {
  private userService: UserService

  public constructor(userService: UserService) {
    this.userService = userService
  }

  public async me(id: number) {
    return this.userService.getById(id)
  }

  public async login(email: string, password: string) {
    try {
      const user = await this.userService.getByEmail(email)
      const passwordMatch = await bcrypt.compare(password, user.password)

      if (!passwordMatch) {
        throw new Error('Password does not match')
      }

      await user.load('roles')

      return jwt.sign({ user: user.toJSON() }, Config.get('auth.jwt.secret'), {
        expiresIn: Config.get('auth.jwt.expiresIn')
      })
    } catch (err) {
      Log.error('Login failed: %o', err)
      throw new UnauthorizedException('Access denied')
    }
  }

  public async register(data: Partial<User>) {
    data.password = await bcrypt.hash(data.password, 10)

    return this.userService.create(data)
  }
}
