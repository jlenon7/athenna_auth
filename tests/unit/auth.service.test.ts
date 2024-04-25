import bcrypt from 'bcrypt'
import { UserService } from '#src/services/user.service'
import { AuthService } from '#src/services/auth.service'
import { NotFoundException, UnauthorizedException } from '@athenna/http'
import { Test, type Context, Mock, AfterEach, BeforeEach } from '@athenna/test'

export default class AuthServiceTest {
  private userService: UserService

  @BeforeEach()
  public beforeEach() {
    this.userService = new UserService()
  }

  @AfterEach()
  public afterEach() {
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
      load: () => {}
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

    Mock.when(this.userService, 'create').resolve(userToRegister)

    const authService = new AuthService(this.userService)
    const user = await authService.register(userToRegister)

    assert.deepEqual(user, userToRegister)
    assert.notCalledWithMatch(this.userService.create, { password: '12345' })
    assert.calledWithMatch(this.userService.create, { name: userToRegister.name, email: userToRegister.email })
  }
}
