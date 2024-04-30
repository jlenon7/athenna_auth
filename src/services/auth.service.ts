import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Mail } from '@athenna/mail'
import { Log } from '@athenna/logger'
import { Uuid } from '@athenna/common'
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
    data.emailToken = Uuid.generate()
    data.password = await bcrypt.hash(data.password, 10)

    const user = await this.userService.create(data)

    // TODO Move this to a queue
    Mail.from('noreply@athenna.io')
      .to(user.email)
      .subject('Athenna Account Activation')
      .view('mail/register', { user })
      .send()

    return user
  }

  public async verifyEmail(emailToken: string) {
    const user = await this.userService.getByEmailToken(emailToken)

    user.emailVerifiedAt = new Date()

    await user.save()
  }
}
