import bcrypt from 'bcrypt'
import { User } from '#src/models/user'
import { Role } from '#src/models/role'
import { SmtpServer } from '@athenna/mail'
import { Database } from '@athenna/database'
import { RoleUser } from '#src/models/roleuser'
import { Queue } from '#src/providers/facades/queue'
import { BaseE2ETest } from '#tests/helpers/base.e2e.test'
import { Test, type Context, AfterAll, BeforeAll } from '@athenna/test'

export default class UserControllerTest extends BaseE2ETest {
  @BeforeAll()
  public async beforeAll() {
    await SmtpServer.create({ disabledCommands: ['AUTH'] }).listen(5025)
    await Database.runSeeders()
  }

  @AfterAll()
  public async afterAll() {
    await Queue.truncate()
    await User.truncate()
    await Role.truncate()
    await RoleUser.truncate()
    await SmtpServer.close()
    await Database.close()
  }

  @Test()
  public async shouldBeAbleToGetAllUsers({ request }: Context) {
    const token = await this.getAdminToken()
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
    const token = await this.getCustomerToken()
    const response = await request.get('/api/v1/users', { headers: { authorization: token } })

    response.assertStatusCode(401)
    response.assertBodyContains({
      data: { code: 'E_UNAUTHORIZED_ERROR', message: 'Access denied', name: 'UnauthorizedException' }
    })
  }

  @Test()
  public async shouldBeAbleToGetAUserById({ request }: Context) {
    const user = await User.find({ email: 'customer@athenna.io' })
    const token = await this.getAdminToken()
    const response = await request.get(`/api/v1/users/${user.id}`, { headers: { authorization: token } })

    response.assertStatusCode(200)
    response.assertBodyContains({
      data: { name: 'Customer', email: 'customer@athenna.io' }
    })
  }

  @Test()
  public async shouldBeAbleToGetOwnUserByIdAsACustomer({ request }: Context) {
    const user = await User.find({ email: 'customer@athenna.io' })
    const token = await this.getCustomerToken()
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
  public async shouldThrowUnauthorizedExceptionWhenTryingToGetOneUserWithoutAToken({ request }: Context) {
    const response = await request.get('/api/v1/users/1')

    response.assertStatusCode(401)
    response.assertBodyContains({
      data: { code: 'E_UNAUTHORIZED_ERROR', message: 'Access denied', name: 'UnauthorizedException' }
    })
  }

  @Test()
  public async shouldThrowUnauthorizedExceptionWhenTryingToGetAUserDifferentThenYoursAsACustomer({ request }: Context) {
    const user = await User.find({ email: 'admin@athenna.io' })
    const token = await this.getCustomerToken()
    const response = await request.get(`/api/v1/users/${user.id}`, { headers: { authorization: token } })

    response.assertStatusCode(401)
    response.assertBodyContains({
      data: { code: 'E_UNAUTHORIZED_ERROR', message: 'Access denied', name: 'UnauthorizedException' }
    })
  }

  @Test()
  public async shouldBeAbleToUpdateAUserName({ assert, request }: Context) {
    const user = await this.createCustomer()
    const token = await this.createToken(user)
    const response = await request.put(`/api/v1/users/${user.id}`, {
      body: { name: 'Customer Updated' },
      headers: { authorization: token }
    })

    await user.refresh()

    assert.deepEqual(user.name, 'Customer Updated')
    response.assertStatusCode(200)
    response.assertBodyContains({
      data: { name: 'Customer Updated' }
    })
  }

  @Test()
  public async shouldNotBeAbleToUpdateAUserEmailWithoutEmailConfirmation({ assert, request }: Context) {
    const user = await User.find({ email: 'customer@athenna.io' })
    const token = await this.getAdminToken()
    const response = await request.put(`/api/v1/users/${user.id}`, {
      body: { name: 'Customer Updated', email: 'customer-updated@athenna.io' },
      headers: { authorization: token }
    })

    await user.refresh()

    const queue = Queue.queue('user:email')

    assert.deepEqual(await queue.length(), 1)
    assert.deepEqual(user.name, 'Customer Updated')
    assert.deepEqual(user.email, 'customer@athenna.io')
    response.assertStatusCode(200)
    response.assertBodyContains({
      data: { name: 'Customer Updated', email: 'customer@athenna.io' }
    })
  }

  @Test()
  public async shouldNotBeAbleToUpdateAUserPasswordWithoutEmailConfirmation({ assert, request }: Context) {
    const user = await User.find({ email: 'customer@athenna.io' })
    const token = await this.getAdminToken()
    const response = await request.put(`/api/v1/users/${user.id}`, {
      body: { name: 'Customer Updated', password: '12345678', password_confirmation: '12345678' },
      headers: { authorization: token }
    })

    await user.refresh()

    const queue = Queue.queue('user:password')

    assert.deepEqual(await queue.length(), 1)
    assert.deepEqual(user.name, 'Customer Updated')
    assert.isTrue(await bcrypt.compare('12345', user.password))
    response.assertStatusCode(200)
    response.assertBodyContains({
      data: { name: 'Customer Updated', email: 'customer@athenna.io' }
    })
  }

  @Test()
  public async shouldNotBeAbleToUpdateAUserEmailAndPasswordWithoutEmailConfirmation({ assert, request }: Context) {
    const user = await User.find({ email: 'customer@athenna.io' })
    const token = await this.getAdminToken()
    const response = await request.put(`/api/v1/users/${user.id}`, {
      body: {
        name: 'Customer Updated',
        email: 'customer-updated@athenna.io',
        password: '12345678',
        password_confirmation: '12345678'
      },
      headers: { authorization: token }
    })

    await user.refresh()

    const queue = Queue.queue('user:email:password')

    assert.deepEqual(await queue.length(), 1)
    assert.deepEqual(user.name, 'Customer Updated')
    assert.isTrue(await bcrypt.compare('12345', user.password))
    response.assertStatusCode(200)
    response.assertBodyContains({
      data: { name: 'Customer Updated', email: 'customer@athenna.io' }
    })
  }

  @Test()
  public async shouldBeAbleToUpdateOwnUserByIdAsACustomer({ assert, request }: Context) {
    const user = await this.createCustomer()
    const token = await this.createToken(user)
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
      data: { name: 'Customer Updated' }
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
    const token = await this.getCustomerToken()
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
    const user = await this.createCustomer()
    const token = await this.getAdminToken()
    const response = await request.delete(`/api/v1/users/${user.id}`, {
      headers: { authorization: token }
    })

    await user.refresh()

    assert.isDefined(user.deletedAt)
    response.assertStatusCode(204)
  }

  @Test()
  public async shouldBeAbleToDeleteOwnUserByIdAsACustomer({ assert, request }: Context) {
    const user = await this.createCustomer()
    const token = await this.createToken(user)
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
    const user = await this.createCustomer()
    const token = await this.createToken(user)
    const response = await request.delete('/api/v1/users/2', {
      headers: { authorization: token }
    })

    response.assertStatusCode(401)
    response.assertBodyContains({
      data: { code: 'E_UNAUTHORIZED_ERROR', message: 'Access denied', name: 'UnauthorizedException' }
    })
  }
}
