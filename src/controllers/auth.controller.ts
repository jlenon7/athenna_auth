import { Inject } from '@athenna/ioc'
import { Controller, type Context } from '@athenna/http'
import type { AuthService } from '#src/service/auth.service'

@Controller()
export class AuthController {
  @Inject()
  private authService: AuthService

  public async login({ request, response }: Context) {
    const { email, password } = request.only(['email', 'password'])
    const token = await this.authService.login(email, password)

    return response.status(200).send({ token })
  }
}
