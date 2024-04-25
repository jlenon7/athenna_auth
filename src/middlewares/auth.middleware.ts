import jwt from 'jsonwebtoken'
import { Log } from '@athenna/logger'
import { Config } from '@athenna/config'
import { RoleEnum } from '#src/enums/role.enum'
import type { Context, MiddlewareContract } from '@athenna/http'
import { Middleware, UnauthorizedException } from '@athenna/http'

@Middleware({ name: 'auth' })
export class AuthMiddleware implements MiddlewareContract {
  public async handle(ctx: Context): Promise<void> {
    const token = ctx.request.header('authorization')

    if (!token) {
      Log.trace('Authorization token is not present in request headers.')

      throw new UnauthorizedException('Access denied')
    }

    ctx.data.auth = this.decodeToken(token)

    this.validatePermissions(ctx)
  }

  private decodeToken(token: string) {
    try {
      return jwt.verify(token, Config.get('auth.jwt.secret'))
    } catch (err) {
      Log.error('Verification of JWT token failed: %o', err)

      throw new UnauthorizedException('Access denied')
    }
  }

  private validatePermissions({ data, request }: Context) {
    const action = this.methodToAction(request.method)

    let hasPermission = false

    const user = data.auth.user
    const roles = user.roles.map(role => role.name)
    const isAdmin = roles.includes(RoleEnum.ADMIN)

    for (const role of roles) {
      const permission = Config.get(`auth.jwt.permissions.${role}`)

      if (!permission) {
        Log.trace(
          `User with id ${user.id} has a role that is not available in permissions configuration. Available ones are [${RoleEnum.ADMIN}, ${RoleEnum.CUSTOMER}].`
        )

        hasPermission = false

        break
      }

      const resource = permission[request.routeName]

      if (!resource) {
        Log.trace(
          `None permission was found for route with name ${request.routeName}. Enabling client to bypass the role validation.`
        )

        hasPermission = true

        break
      }

      if (resource.includes(action)) {
        Log.trace(
          `User with id ${user.id} is authorized to perform ${action} action.`
        )

        hasPermission = true

        break
      }
    }

    if (!hasPermission) {
      throw new UnauthorizedException('Access denied')
    }

    const id = request.param('id')

    if (
      id &&
      user.id !== parseInt(id) &&
      request.routeName === 'users' &&
      !isAdmin
    ) {
      Log.trace(
        `User with id ${user.id} is not authorized to access resources of user with id ${id}. Only [${RoleEnum.ADMIN}] roles could do that.`
      )

      throw new UnauthorizedException('Access denied')
    }

    if (
      request.method === 'GET' &&
      request.routeUrl.endsWith('/users') &&
      !isAdmin
    ) {
      Log.trace(
        `User with id ${user.id} is not authorized to access resources of other users. Only [${RoleEnum.ADMIN}] roles could do that.`
      )

      throw new UnauthorizedException('Access denied')
    }
  }

  private methodToAction(method: string) {
    const permissionMap = {
      GET: 'read',
      POST: 'write',
      PUT: 'update',
      DELETE: 'delete'
    }

    return permissionMap[method]
  }
}
