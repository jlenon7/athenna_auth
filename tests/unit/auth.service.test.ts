import bcrypt from 'bcrypt'
import { Mail } from '@athenna/mail'
import { Uuid } from '@athenna/common'
import { Queue } from '#src/providers/facades/queue'
import { UserService } from '#src/services/user.service'
import { AuthService } from '#src/services/auth.service'
import { NotFoundException, UnauthorizedException } from '@athenna/http'
import { Test, type Context, Mock, AfterEach, BeforeEach } from '@athenna/test'

export default class AuthServiceTest {
  private userService: UserService

  @BeforeEach()
  public beforeEach() {
    Config.set('database.default', 'fake')

    this.userService = new UserService()
  }

  @AfterEach()
  public afterEach() {
    Config.set('database.default', Env('DB_CONNECTION', 'postgres'))

    Mock.restoreAll()
  }

  @Test()
  public async shouldBeAbleToGetTheDataOfTheLoggedInUser({ assert }: Context) {
    Mock.when(this.userService, 'getById').resolve({ id: 1 })

    const authService = new AuthService(this.userService)

    const user = await authService.me(1)

    assert.deepEqual(user, { id: 1 })
  }

  @Test()
  public async shouldThrowNotFoundExceptionIfUserDoesNotExist({ assert }: Context) {
    Mock.when(this.userService, 'getById').reject(new NotFoundException('Not found user with 1 id'))

    const authService = new AuthService(this.userService)

    await assert.rejects(() => authService.me(1), NotFoundException)
  }

  @Test()
  public async shouldBeAbleToLoginUserByCreatingJWTToken({ assert }: Context) {
    Mock.when(this.userService, 'getByEmail').resolve({
      password: await bcrypt.hash('12345', 10),
      toJSON: () => {},
      load: () => {},
      isEmailEqual: () => {},
      isPasswordEqual: () => true
    })

    const authService = new AuthService(this.userService)

    const token = await authService.login('lenon@athenna.io', '12345')

    assert.isDefined(token)
  }

  @Test()
  public async shouldThrowUnauthorizedExceptionWhenUserDoesNotExist({ assert }: Context) {
    const authService = new AuthService(this.userService)

    await assert.rejects(() => authService.login('lenon@athenna.io', '12345'), UnauthorizedException)
  }

  @Test()
  public async shouldThrowUnauthorizedExceptionWhenPasswordDoesNotMatch({ assert }: Context) {
    Mock.when(this.userService, 'getByEmail').resolve({ password: await bcrypt.hash('123456', 10) })

    const authService = new AuthService(this.userService)

    await assert.rejects(() => authService.login('lenon@athenna.io', '12345'), UnauthorizedException)
  }

  @Test()
  public async shouldBeAbleToRegisterANewUser({ assert }: Context) {
    const userToRegister = {
      name: 'João Lenon',
      email: 'lenon@athenna.io',
      password: '12345'
    }

    Mail.when('send').resolve(undefined)
    Queue.when('queue').resolve({ add: () => {} })
    Mock.when(this.userService, 'create').resolve(userToRegister)

    const authService = new AuthService(this.userService)
    const user = await authService.register(userToRegister)

    assert.deepEqual(user, userToRegister)
    assert.notCalledWithMatch(this.userService.create, { password: '12345' })
    assert.calledWithMatch(this.userService.create, { name: userToRegister.name, email: userToRegister.email })
  }

  @Test()
  public async shouldBeAbleToVerifyUserEmail({ assert }: Context) {
    const userRegistered = {
      name: 'João Lenon',
      email: 'lenon@athenna.io',
      password: '12345',
      token: Uuid.generate(),
      emailVerifiedAt: null,
      save: Mock.fake()
    }

    Mock.when(this.userService, 'getByToken').resolve(userRegistered)

    const authService = new AuthService(this.userService)

    await authService.confirm(userRegistered.token)

    assert.calledOnce(userRegistered.save)
  }

  @Test()
  public async shouldThrowNotFoundExceptionWhenUserDoesNotExist({ assert }: Context) {
    const token = Uuid.generate()

    Mock.when(this.userService, 'getByToken').reject(new NotFoundException(`Not found user with email token ${token}`))

    const authService = new AuthService(this.userService)

    await assert.rejects(() => authService.confirm(token), NotFoundException)
  }
}
