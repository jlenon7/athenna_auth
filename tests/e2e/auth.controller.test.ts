import bcrypt from 'bcrypt'
import { User } from '#src/models/user'
import { Role } from '#src/models/role'
import { SmtpServer } from '@athenna/mail'
import { Database } from '@athenna/database'
import { RoleUser } from '#src/models/roleuser'
import { Queue } from '#src/providers/facades/queue'
import { BaseE2ETest } from '#tests/helpers/base.e2e.test'
import { Test, type Context, AfterAll, BeforeAll } from '@athenna/test'

export default class AuthControllerTest extends BaseE2ETest {
  @BeforeAll()
  public async beforeAll() {
    await SmtpServer.create({ disabledCommands: ['AUTH'] }).listen(5025)
    await Database.runSeeders()
  }

  @AfterAll()
  public async afterAll() {
    await Queue.truncate()
    await SmtpServer.close()
    await User.truncate()
    await Role.truncate()
    await RoleUser.truncate()
    await Database.close()
  }

  @Test()
  public async shouldBeAbleToGetTheAuthenticatedUserUsingMeEndpoint({ request }: Context) {
    const token = await this.getCustomerToken()
    const response = await request.get('/api/v1/me', { headers: { authorization: token } })

    response.assertStatusCode(200)
    response.assertBodyContains({
      data: { name: 'Customer', email: 'customer@athenna.io' }
    })
  }

  @Test()
  public async shouldThrowUnauthorizedExceptionIfAuthenticatedDontHaveRolesKey({ request }: Context) {
    const token = this.createFakeToken({ user: { id: -1 } })

    const response = await request.get('/api/v1/me', { headers: { authorization: token } })

    response.assertStatusCode(401)
    response.assertBodyContains({
      data: { code: 'E_UNAUTHORIZED_ERROR', message: 'Access denied', name: 'UnauthorizedException' }
    })
  }

  @Test()
  public async shouldThrowUnauthorizedExceptionIfAuthenticatedUserCannotBeFound({ request }: Context) {
    const token = this.createFakeToken({ user: { id: -1, roles: [] } })

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

  @Test()
  public async shouldThrowValidationErrorWhenFieldsAreNotDefinedInBodyWhenLogin({ request }: Context) {
    const response = await request.post('/api/v1/login')

    response.assertStatusCode(422)
    response.assertBodyContains({
      data: {
        code: 'E_VALIDATION_ERROR',
        message: 'Validation failure',
        name: 'ValidationException',
        details: [
          {
            field: 'email',
            message: 'The email field must be defined',
            rule: 'required'
          },
          {
            field: 'password',
            message: 'The password field must be defined',
            rule: 'required'
          }
        ]
      }
    })
  }

  @Test()
  public async shouldBeAbleToRegisterANewUser({ assert, request }: Context) {
    const response = await request.post('/api/v1/register', {
      body: {
        name: 'Test',
        email: 'test@athenna.io',
        password: '12345678',
        password_confirmation: '12345678'
      }
    })

    const queue = Queue.queue('user:confirm')

    assert.deepEqual(await queue.length(), 1)
    assert.isTrue(await User.exists({ email: 'test@athenna.io' }))
    response.assertStatusCode(201)
    response.assertBodyContains({
      data: {
        name: 'Test',
        email: 'test@athenna.io'
      }
    })
  }

  @Test()
  public async shouldThrowValidationErrorWhenFieldsAreNotDefinedInBodyWhenRegisteringUser({ request }: Context) {
    const response = await request.post('/api/v1/register')

    response.assertStatusCode(422)
    response.assertBodyContains({
      data: {
        code: 'E_VALIDATION_ERROR',
        message: 'Validation failure',
        name: 'ValidationException',
        details: [
          {
            field: 'name',
            message: 'The name field must be defined',
            rule: 'required'
          },
          {
            field: 'email',
            message: 'The email field must be defined',
            rule: 'required'
          },
          {
            field: 'password',
            message: 'The password field must be defined',
            rule: 'required'
          }
        ]
      }
    })
  }

  @Test()
  public async shouldThrowValidationErrorWhenPasswordLenghtIsLessThenEightWhenRegisteringUser({ request }: Context) {
    const response = await request.post('/api/v1/register', {
      body: {
        name: 'Test',
        email: 'test@athenna.io',
        password: '12345'
      }
    })

    response.assertStatusCode(422)
    response.assertBodyContains({
      data: {
        code: 'E_VALIDATION_ERROR',
        message: 'Validation failure',
        name: 'ValidationException',
        details: [
          {
            field: 'password',
            message: 'The password field must have at least 8 characters',
            meta: {
              min: 8
            },
            rule: 'minLength'
          }
        ]
      }
    })
  }

  @Test()
  public async shouldThrowValidationErrorWhenPasswordConfirmationIsMissingWhenRegisteringUser({ request }: Context) {
    const response = await request.post('/api/v1/register', {
      body: {
        name: 'Test',
        email: 'test@athenna.io',
        password: '12345678'
      }
    })

    response.assertStatusCode(422)
    response.assertBodyContains({
      data: {
        code: 'E_VALIDATION_ERROR',
        message: 'Validation failure',
        name: 'ValidationException',
        details: [
          {
            field: 'password',
            message: 'The password field and password_confirmation field must be the same',
            meta: {
              otherField: 'password_confirmation'
            },
            rule: 'confirmed'
          }
        ]
      }
    })
  }

  @Test()
  public async shouldThrowValidationErrorWhenTryingToCreateAnUserWithAnEmailThatAlreadyExists({ request }: Context) {
    const response = await request.post('/api/v1/register', {
      body: {
        name: 'Test',
        email: 'customer@athenna.io',
        password: '12345678'
      }
    })

    response.assertStatusCode(422)
    response.assertBodyContains({
      data: {
        code: 'E_VALIDATION_ERROR',
        message: 'Validation failure',
        name: 'ValidationException',
        details: [
          {
            field: 'email',
            message: 'The email field is not unique',
            rule: 'unique'
          }
        ]
      }
    })
  }

  @Test()
  public async shouldBeAbleToConfirmUserAccount({ assert, request }: Context) {
    const user = await User.factory().create({ emailVerifiedAt: null })

    const response = await request.get('/api/v1/confirm/account', {
      query: {
        token: user.token
      }
    })

    await user.refresh()

    assert.isDefined(user.emailVerifiedAt)
    response.assertStatusCode(204)
  }

  @Test()
  public async shouldThrowNotFoundExceptionIfTokenDoesNotExistWhenConfirmingAccount({ request }: Context) {
    const response = await request.get('/api/v1/confirm/account', {
      query: {
        token: 'not-found'
      }
    })

    response.assertStatusCode(404)
    response.assertBodyContains({
      data: {
        code: 'E_NOT_FOUND_ERROR',
        message: 'Not found any user with token not-found.',
        name: 'NotFoundException'
      }
    })
  }

  @Test()
  public async shouldBeAbleToConfirmUserEmail({ assert, request }: Context) {
    const user = await User.factory().create()

    const response = await request.get('/api/v1/confirm/email', {
      query: {
        token: user.token,
        email: 'newemail@athenna.io'
      }
    })

    await user.refresh()

    assert.deepEqual(user.email, 'newemail@athenna.io')
    response.assertStatusCode(204)
  }

  @Test()
  public async shouldThrowNotFoundExceptionIfTokenDoesNotExistWhenConfirmingEmail({ request }: Context) {
    const response = await request.get('/api/v1/confirm/email', {
      query: {
        token: 'not-found'
      }
    })

    response.assertStatusCode(404)
    response.assertBodyContains({
      data: {
        code: 'E_NOT_FOUND_ERROR',
        message: 'Not found any user with token not-found.',
        name: 'NotFoundException'
      }
    })
  }

  @Test()
  public async shouldBeAbleToConfirmUserPassword({ assert, request }: Context) {
    const user = await User.factory().create()

    const response = await request.get('/api/v1/confirm/password', {
      query: {
        token: user.token,
        password: await bcrypt.hash('1234567', 10)
      }
    })

    await user.refresh()

    assert.isTrue(user.isPasswordEqual('1234567'))
    response.assertStatusCode(204)
  }

  @Test()
  public async shouldThrowNotFoundExceptionIfTokenDoesNotExistWhenConfirmingPassword({ request }: Context) {
    const response = await request.get('/api/v1/confirm/password', {
      query: {
        token: 'not-found'
      }
    })

    response.assertStatusCode(404)
    response.assertBodyContains({
      data: {
        code: 'E_NOT_FOUND_ERROR',
        message: 'Not found any user with token not-found.',
        name: 'NotFoundException'
      }
    })
  }

  @Test()
  public async shouldBeAbleToConfirmUserEmailPassword({ assert, request }: Context) {
    const user = await User.factory().create()

    const response = await request.get('/api/v1/confirm/email/password', {
      query: {
        token: user.token,
        email: 'newemaill@athenna.io',
        password: await bcrypt.hash('1234567', 10)
      }
    })

    await user.refresh()

    assert.deepEqual(user.email, 'newemaill@athenna.io')
    assert.isTrue(user.isPasswordEqual('1234567'))
    response.assertStatusCode(204)
  }

  @Test()
  public async shouldThrowNotFoundExceptionIfTokenDoesNotExistWhenConfirmingEmailPassword({ request }: Context) {
    const response = await request.get('/api/v1/confirm/email/password', {
      query: {
        token: 'not-found'
      }
    })

    response.assertStatusCode(404)
    response.assertBodyContains({
      data: {
        code: 'E_NOT_FOUND_ERROR',
        message: 'Not found any user with token not-found.',
        name: 'NotFoundException'
      }
    })
  }
}
