import jwt from 'jsonwebtoken'
import { User } from '#src/models/user'
import { Role } from '#src/models/role'
import { Config } from '@athenna/config'
import { Database } from '@athenna/database'
import { RoleUser } from '#src/models/roleuser'
import { BaseHttpTest } from '@athenna/core/testing/BaseHttpTest'
import { Test, type Context, AfterAll, BeforeAll } from '@athenna/test'

export default class AuthControllerTest extends BaseHttpTest {
  @BeforeAll()
  public async beforeAll() {
    Config.set('database.default', 'postgres')

    await Database.runSeeders()
  }

  @AfterAll()
  public async afterAll() {
    await User.truncate()
    await Role.truncate()
    await RoleUser.truncate()
    await Database.close()

    Config.set('database.default', Env('DB_CONNECTION', 'fake'))
  }

  @Test()
  public async shouldBeAbleToGetTheAuthenticatedUserUsingMeEndpoint({ request }: Context) {
    const token = await ioc.use('authService').login('customer@athenna.io', '12345')
    const response = await request.get('/api/v1/me', { headers: { authorization: token } })

    response.assertStatusCode(200)
    response.assertBodyContains({
      data: { name: 'Customer', email: 'customer@athenna.io' }
    })
  }

  @Test()
  public async shouldThrowUnauthorizedExceptionIfAuthenticatedDontHaveRolesKey({ request }: Context) {
    const token = await jwt.sign({ user: { id: -1 } }, Config.get('auth.jwt.secret'), {
      expiresIn: Config.get('auth.jwt.expiresIn')
    })

    const response = await request.get('/api/v1/me', { headers: { authorization: token } })

    response.assertStatusCode(401)
    response.assertBodyContains({
      data: { code: 'E_UNAUTHORIZED_ERROR', message: 'Access denied', name: 'UnauthorizedException' }
    })
  }

  @Test()
  public async shouldThrowUnauthorizedExceptionIfAuthenticatedUserCannotBeFound({ request }: Context) {
    const token = await jwt.sign({ user: { id: -1, roles: [] } }, Config.get('auth.jwt.secret'), {
      expiresIn: Config.get('auth.jwt.expiresIn')
    })

    const response = await request.get('/api/v1/me', { headers: { authorization: token } })

    response.assertStatusCode(401)
    response.assertBodyContains({
      data: { code: 'E_UNAUTHORIZED_ERROR', message: 'Access denied', name: 'UnauthorizedException' }
    })
  }

  @Test()
  public async shouldBeAbleToGetTheAuthTokenUsingLoginEndpoint({ request }: Context) {
    const response = await request.post('/api/v1/login', { body: { email: 'customer@athenna.io', password: '12345' } })

    response.assertStatusCode(200)
    response.assertBodyContainsKey('data.token')
  }

  @Test()
  public async shouldThrowUnauthorizedExceptionIfUserEmailCannotBeFound({ request }: Context) {
    const response = await request.post('/api/v1/login', { body: { email: 'not-found@athenna.io', password: '12345' } })

    response.assertStatusCode(401)
    response.assertBodyContains({
      data: { code: 'E_UNAUTHORIZED_ERROR', message: 'Access denied', name: 'UnauthorizedException' }
    })
  }

  @Test()
  public async shouldThrowUnauthorizedExceptionIfUserPasswordDoesNotMatch({ request }: Context) {
    const response = await request.post('/api/v1/login', {
      body: { email: 'customer@athenna.io', password: 'not-found' }
    })

    response.assertStatusCode(401)
    response.assertBodyContains({
      data: { code: 'E_UNAUTHORIZED_ERROR', message: 'Access denied', name: 'UnauthorizedException' }
    })
  }
}
