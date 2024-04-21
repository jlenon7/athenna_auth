import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Config } from '@athenna/config'
import { Service, Inject } from '@athenna/ioc'
import { UnauthorizedException } from '@athenna/http'
import type { UserService } from '#src/services/user.service'

@Service()
export class AuthService {
  @Inject()
  private userService: UserService

  public async login(email: string, password: string) {
    const user = await this.userService.getByEmailSafe(email)

    if (!user) {
      throw new UnauthorizedException('Authentication failed.')
    }

    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      throw new UnauthorizedException('Authentication failed.')
    }

    return jwt.sign({ user: user.toJSON() }, Config.get('auth.jwt.secret'), {
      expiresIn: Config.get('auth.jwt.expiresIn')
    })
  }
}
