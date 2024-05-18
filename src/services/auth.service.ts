import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Log } from '@athenna/logger'
import { Queue } from '@athenna/queue'
import { Service } from '@athenna/ioc'
import { User } from '#src/models/user'
import { Config } from '@athenna/config'
import { Token } from '#src/models/token'
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
      const passwordMatch = user.isPasswordEqual(password)

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

    const user = await this.userService.create(data)
    const token = await user.confirmToken()

    await Queue.queue('mail').add({
      user,
      token,
      view: 'mail/confirm',
      subject: 'Athenna Account Confirmation'
    })

    return user
  }

  public async confirm(tkn: string) {
    const token = await Token.findOrThrowNotFound(tkn)
    const user = await this.userService.getByToken(token)

    user.emailVerifiedAt = new Date()

    await user.save()
  }

  public async resetEmail(tkn: string) {
    const token = await Token.findOrThrowNotFound(tkn)
    const user = await this.userService.getByToken(token)

    user.email = token.value

    await user.save()
  }

  public async resetPassword(tkn: string) {
    const token = await Token.findOrThrowNotFound(tkn)
    const user = await this.userService.getByToken(token)

    user.password = token.value

    await user.save()
  }

  public async resetEmailPassword(tkn: string) {
    const token = await Token.findOrThrowNotFound(tkn)
    const user = await this.userService.getByToken(token)

    const [email, password] = JSON.parse(token.value)

    user.email = email
    user.password = password

    await user.save()
  }
}
