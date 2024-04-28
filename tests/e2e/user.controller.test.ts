import bcrypt from 'bcrypt'
import { User } from '#src/models/user'
import { Role } from '#src/models/role'
import { Config } from '@athenna/config'
import { Database } from '@athenna/database'
import { RoleUser } from '#src/models/roleuser'
import { BaseHttpTest } from '@athenna/core/testing/BaseHttpTest'
import { Test, type Context, AfterEach, BeforeEach } from '@athenna/test'

export default class UserControllerTest extends BaseHttpTest {
  @BeforeEach()
  public async beforeEach() {
    Config.set('database.default', 'postgres')

    await Database.runSeeders()
  }

  @AfterEach()
  public async afterEach() {
    await User.truncate()
    await Role.truncate()
    await RoleUser.truncate()
    await Database.close()

    Config.set('database.default', Env('DB_CONNECTION', 'fake'))
  }

  @Test()
  public async shouldBeAbleToGetAllUsers({ request }: Context) {
    const token = await ioc.use('authService').login('admin@athenna.io', '12345')
    const response = await request.get('/api/v1/users', { headers: { authorization: token } })

    response.assertStatusCode(200)
    response.assertBodyContains({
      data: [
        { name: 'Admin', email: 'admin@athenna.io' },
        { name: 'Customer', email: 'customer@athenna.io' }
      ]
    })
  }

  @Test()
  public async shouldThrowUnauthorizedExceptionWhenTryingToGetAllUsersWithAnInvalidToken({ request }: Context) {
    const response = await request.get('/api/v1/users', { headers: { authorization: 'invalid' } })

    response.assertStatusCode(401)
    response.assertBodyContains({
      data: { code: 'E_UNAUTHORIZED_ERROR', message: 'Access denied', name: 'UnauthorizedException' }
    })
  }

  @Test()
  public async shouldThrowUnauthorizedExceptionWhenTryingToGetAllUsersWithoutAToken({ request }: Context) {
    const response = await request.get('/api/v1/users')

    response.assertStatusCode(401)
    response.assertBodyContains({
      data: { code: 'E_UNAUTHORIZED_ERROR', message: 'Access denied', name: 'UnauthorizedException' }
    })
  }

  @Test()
  public async shouldThrowUnauthorizedExceptionWhenTryingToGetAllUsersAsACustomer({ request }: Context) {
    const token = await ioc.use('authService').login('customer@athenna.io', '12345')
    const response = await request.get('/api/v1/users', { headers: { authorization: token } })

    response.assertStatusCode(401)
    response.assertBodyContains({
      data: { code: 'E_UNAUTHORIZED_ERROR', message: 'Access denied', name: 'UnauthorizedException' }
    })
  }

  @Test()
  public async shouldBeAbleToGetAUserById({ request }: Context) {
    const user = await User.find({ email: 'customer@athenna.io' })
    const token = await ioc.use('authService').login('admin@athenna.io', '12345')
    const response = await request.get(`/api/v1/users/${user.id}`, { headers: { authorization: token } })

    response.assertStatusCode(200)
    response.assertBodyContains({
      data: { name: 'Customer', email: 'customer@athenna.io' }
    })
  }

  @Test()
  public async shouldBeAbleToGetOwnUserByIdAsACustomer({ request }: Context) {
    const user = await User.find({ email: 'customer@athenna.io' })
    const token = await ioc.use('authService').login('customer@athenna.io', '12345')
    const response = await request.get(`/api/v1/users/${user.id}`, { headers: { authorization: token } })

    response.assertStatusCode(200)
    response.assertBodyContains({
      data: { name: 'Customer', email: 'customer@athenna.io' }
    })
  }

  @Test()
  public async shouldThrowUnauthorizedExceptionWhenTryingToGetWithAnInvalidToken({ request }: Context) {
    const response = await request.get('/api/v1/users/1', { headers: { authorization: 'invalid' } })

    response.assertStatusCode(401)
    response.assertBodyContains({
      data: { code: 'E_UNAUTHORIZED_ERROR', message: 'Access denied', name: 'UnauthorizedException' }
    })
  }

  @Test()
  public async shouldThrowUnauthorizedExceptionWhenTryingToGetAllUsersWithoutAToken({ request }: Context) {
    const response = await request.get('/api/v1/users/1')

    response.assertStatusCode(401)
    response.assertBodyContains({
      data: { code: 'E_UNAUTHORIZED_ERROR', message: 'Access denied', name: 'UnauthorizedException' }
    })
  }

  @Test()
  public async shouldThrowUnauthorizedExceptionWhenTryingToGetAUserDifferentThenYoursAsACustomer({ request }: Context) {
    const user = await User.find({ email: 'admin@athenna.io' })
    const token = await ioc.use('authService').login('customer@athenna.io', '12345')
    const response = await request.get(`/api/v1/users/${user.id}`, { headers: { authorization: token } })

    response.assertStatusCode(401)
    response.assertBodyContains({
      data: { code: 'E_UNAUTHORIZED_ERROR', message: 'Access denied', name: 'UnauthorizedException' }
    })
  }

  @Test()
  public async shouldBeAbleToUpdateAUserName({ assert, request }: Context) {
    const user = await User.find({ email: 'customer@athenna.io' })
    const token = await ioc.use('authService').login('admin@athenna.io', '12345')
    const response = await request.put(`/api/v1/users/${user.id}`, {
      body: { name: 'Customer Updated' },
      headers: { authorization: token }
    })

    await user.refresh()

    assert.deepEqual(user.name, 'Customer Updated')
    response.assertStatusCode(200)
    response.assertBodyContains({
      data: { name: 'Customer Updated', email: 'customer@athenna.io' }
    })
  }

  @Test()
  public async shouldNotBeAbleToUpdateAUserEmail({ assert, request }: Context) {
    const user = await User.find({ email: 'customer@athenna.io' })
    const token = await ioc.use('authService').login('admin@athenna.io', '12345')
    const response = await request.put(`/api/v1/users/${user.id}`, {
      body: { name: 'Customer Updated', email: 'customer-updated@athenna.io' },
      headers: { authorization: token }
    })

    await user.refresh()

    assert.deepEqual(user.name, 'Customer Updated')
    assert.deepEqual(user.email, 'customer@athenna.io')
    response.assertStatusCode(200)
    response.assertBodyContains({
      data: { name: 'Customer Updated', email: 'customer@athenna.io' }
    })
  }

  @Test()
  public async shouldNotBeAbleToUpdateAUserPassword({ assert, request }: Context) {
    const user = await User.find({ email: 'customer@athenna.io' })
    const token = await ioc.use('authService').login('admin@athenna.io', '12345')
    const response = await request.put(`/api/v1/users/${user.id}`, {
      body: { name: 'Customer Updated', password: '123456' },
      headers: { authorization: token }
    })

    await user.refresh()

    assert.deepEqual(user.name, 'Customer Updated')
    assert.isTrue(await bcrypt.compare('12345', user.password))
    response.assertStatusCode(200)
    response.assertBodyContains({
      data: { name: 'Customer Updated', email: 'customer@athenna.io' }
    })
  }

  @Test()
  public async shouldBeAbleToUpdateOwnUserByIdAsACustomer({ assert, request }: Context) {
    const user = await User.find({ email: 'customer@athenna.io' })
    const token = await ioc.use('authService').login('customer@athenna.io', '12345')
    const response = await request.put(`/api/v1/users/${user.id}`, {
      body: {
        name: 'Customer Updated'
      },
      headers: { authorization: token }
    })

    await user.refresh()

    assert.deepEqual(user.name, 'Customer Updated')
    response.assertStatusCode(200)
    response.assertBodyContains({
      data: { name: 'Customer Updated', email: 'customer@athenna.io' }
    })
  }

  @Test()
  public async shouldThrowUnauthorizedExceptionWhenTryingToUpdateAnUserWithAnInvalidToken({ request }: Context) {
    const response = await request.put('/api/v1/users/1', { headers: { authorization: 'invalid' } })

    response.assertStatusCode(401)
    response.assertBodyContains({
      data: { code: 'E_UNAUTHORIZED_ERROR', message: 'Access denied', name: 'UnauthorizedException' }
    })
  }

  @Test()
  public async shouldThrowUnauthorizedExceptionWhenTryingToUpdateAnUserWithoutAToken({ request }: Context) {
    const response = await request.put('/api/v1/users/1')

    response.assertStatusCode(401)
    response.assertBodyContains({
      data: { code: 'E_UNAUTHORIZED_ERROR', message: 'Access denied', name: 'UnauthorizedException' }
    })
  }

  @Test()
  public async shouldThrowUnauthorizedExceptionWhenTryingToUpdateAnUserDifferentThenYoursAsACustomer({
    request
  }: Context) {
    const user = await User.find({ email: 'admin@athenna.io' })
    const token = await ioc.use('authService').login('customer@athenna.io', '12345')
    const response = await request.put(`/api/v1/users/${user.id}`, {
      body: { name: 'Admin Updated' },
      headers: { authorization: token }
    })

    response.assertStatusCode(401)
    response.assertBodyContains({
      data: { code: 'E_UNAUTHORIZED_ERROR', message: 'Access denied', name: 'UnauthorizedException' }
    })
  }

  @Test()
  public async shouldBeAbleToDeleteAUser({ assert, request }: Context) {
    const user = await User.find({ email: 'customer@athenna.io' })
    const token = await ioc.use('authService').login('admin@athenna.io', '12345')
    const response = await request.delete(`/api/v1/users/${user.id}`, {
      headers: { authorization: token }
    })

    await user.refresh()

    assert.isDefined(user.deletedAt)
    response.assertStatusCode(204)
  }

  @Test()
  public async shouldBeAbleToDeleteOwnUserByIdAsACustomer({ assert, request }: Context) {
    const user = await User.find({ email: 'customer@athenna.io' })
    const token = await ioc.use('authService').login('customer@athenna.io', '12345')
    const response = await request.delete(`/api/v1/users/${user.id}`, {
      headers: { authorization: token }
    })

    await user.refresh()

    assert.isDefined(user.deletedAt)
    response.assertStatusCode(204)
  }

  @Test()
  public async shouldThrowUnauthorizedExceptionWhenTryingToDeleteAnUserWithAnInvalidToken({ request }: Context) {
    const response = await request.delete('/api/v1/users/1', { headers: { authorization: 'invalid' } })

    response.assertStatusCode(401)
    response.assertBodyContains({
      data: { code: 'E_UNAUTHORIZED_ERROR', message: 'Access denied', name: 'UnauthorizedException' }
    })
  }

  @Test()
  public async shouldThrowUnauthorizedExceptionWhenTryingToDeleteAnUserWithoutAToken({ request }: Context) {
    const response = await request.delete('/api/v1/users/1')

    response.assertStatusCode(401)
    response.assertBodyContains({
      data: { code: 'E_UNAUTHORIZED_ERROR', message: 'Access denied', name: 'UnauthorizedException' }
    })
  }

  @Test()
  public async shouldThrowUnauthorizedExceptionWhenTryingToDeleteAnUserDifferentThenYoursAsACustomer({
    request
  }: Context) {
    const user = await User.find({ email: 'admin@athenna.io' })
    const token = await ioc.use('authService').login('customer@athenna.io', '12345')
    const response = await request.delete(`/api/v1/users/${user.id}`, {
      headers: { authorization: token }
    })

    response.assertStatusCode(401)
    response.assertBodyContains({
      data: { code: 'E_UNAUTHORIZED_ERROR', message: 'Access denied', name: 'UnauthorizedException' }
    })
  }
}
