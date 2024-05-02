import jwt from 'jsonwebtoken'
import { Uuid } from '@athenna/common'
import { User } from '#src/models/user'
import { Role } from '#src/models/role'
import { Config } from '@athenna/config'
import { SmtpServer } from '@athenna/mail'
import { Database } from '@athenna/database'
import { RoleUser } from '#src/models/roleuser'
import { Queue } from '#src/providers/facades/queue'
import { BaseHttpTest } from '@athenna/core/testing/BaseHttpTest'
import { Test, type Context, AfterAll, BeforeAll } from '@athenna/test'

export default class AuthControllerTest extends BaseHttpTest {
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

    const queue = await Queue.queue('user:register')

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
  public async shouldBeAbleToVerifyUserEmail({ assert, request }: Context) {
    const user = await User.factory().create({ emailToken: Uuid.generate(), emailVerifiedAt: null })

    const response = await request.get('/api/v1/verify-email', {
      query: {
        emailToken: user.emailToken
      }
    })

    await user.refresh()

    assert.isDefined(user.emailVerifiedAt)
    response.assertStatusCode(204)
  }

  @Test()
  public async shouldThrowNotFoundExceptionIfEmailTokenDoesNotExist({ request }: Context) {
    const response = await request.get('/api/v1/verify-email', {
      query: {
        emailToken: 'not-found'
      }
    })

    response.assertStatusCode(404)
    response.assertBodyContains({
      data: {
        code: 'E_NOT_FOUND_ERROR',
        message: 'Not found any user with email token not-found.',
        name: 'NotFoundException'
      }
    })
  }

  @Test()
  public async shouldThrowNotFoundExceptionIfEmailIsAlreadyVerified({ request }: Context) {
    const user = await User.find({ name: 'Customer' })

    const response = await request.get('/api/v1/verify-email', {
      query: {
        emailToken: user.emailToken
      }
    })

    response.assertStatusCode(404)
    response.assertBodyContains({
      data: {
        code: 'E_NOT_FOUND_ERROR',
        message: `Not found any user with email token ${user.emailToken}.`,
        name: 'NotFoundException'
      }
    })
  }
}
