import jwt from 'jsonwebtoken'
import { Config } from '@athenna/config'
import type { Context, MiddlewareContract } from '@athenna/http'
import { Middleware, UnauthorizedException } from '@athenna/http'

@Middleware({ name: 'auth' })
export class AuthMiddleware implements MiddlewareContract {
  public async handle({ data, request }: Context): Promise<void> {
    const token = request.header('authorization')

    if (!token) {
      throw new UnauthorizedException('Access denied')
    }

    try {
      const decoded = jwt.verify(token, Config.get('auth.jwt.secret'))

      data.user = decoded.user
    } catch {
      throw new UnauthorizedException('Access denied')
    }
  }
}
