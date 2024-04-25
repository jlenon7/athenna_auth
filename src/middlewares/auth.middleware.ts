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

      data.auth = decoded
    } catch {
      throw new UnauthorizedException('Access denied')
    }

    const action = this.methodToAction(request.method, !!request.params.id)

    let hasPermission = false

    for (const { name } of data.auth.user.roles) {
      const permission = Config.get(`auth.jwt.permissions.${name}`)

      if (!permission) {
        hasPermission = false
        break
      }

      const resource = permission[request.routeName]

      if (!resource) {
        hasPermission = true
        break
      }

      if (!resource || resource.includes(action)) {
        hasPermission = true
        break
      }
    }

    if (!hasPermission) {
      throw new UnauthorizedException('Access denied')
    }
  }

  private methodToAction(method: string, hasId = false) {
    const permissionMap = {
      GET: hasId ? 'read:own' : 'read:all',
      POST: 'write',
      PUT: 'update',
      DELETE: 'delete'
    }

    return permissionMap[method]
  }
}
