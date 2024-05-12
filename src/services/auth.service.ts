import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Log } from '@athenna/logger'
import { Uuid } from '@athenna/common'
import { Service } from '@athenna/ioc'
import { Config } from '@athenna/config'
import { User } from '#src/models/user'
import { UnauthorizedException } from '@athenna/http'
import type { UserService } from '#src/services/user.service'
import { Queue } from '#src/providers/facades/queue'

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
    data.token = Uuid.generate()
    data.password = await bcrypt.hash(data.password, 10)

    const user = await this.userService.create(data)

    await Queue.connection('vanilla').queue('mail').add({
      user,
      view: 'mail/confirm',
      subject: 'Athenna Account Confirmation'
    })

    return user
  }

  public async confirm(token: string) {
    const user = await this.userService.getByToken(token)

    user.emailVerifiedAt = new Date()

    await user.save()
  }

  public async confirmEmailChange(email: string, token: string) {
    const user = await this.userService.getByToken(token)

    user.email = email

    await user.save()
  }

  public async confirmPasswordChange(password: string, token: string) {
    const user = await this.userService.getByToken(token)

    /**
     * Password is already hashed before sending
     * the data to queue.
     */
    user.password = password

    await user.save()
  }

  public async confirmEmailPasswordChange(
    email: string,
    password: string,
    token: string
  ) {
    const user = await this.userService.getByToken(token)

    user.email = email
    user.password = password

    await user.save()
  }
}
