import bcrypt from 'bcrypt'
import { UnauthorizedException } from '@athenna/http'
import { UserService } from '#src/services/user.service'
import { AuthService } from '#src/services/auth.service'
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
  public async shouldBeAbleToLoginUserByCreatingJWTToken({ assert }: Context) {
    Mock.when(this.userService, 'getByEmail').resolve({ password: await bcrypt.hash('12345', 10), toJSON: () => {} })

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
}
