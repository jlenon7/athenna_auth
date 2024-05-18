import { Inject } from '@athenna/ioc'
import { Controller, type Context } from '@athenna/http'
import type { AuthService } from '#src/services/auth.service'

@Controller()
export class AuthController {
  @Inject()
  private authService: AuthService

  public async me({ data, response }: Context) {
    const user = await this.authService.me(data.auth.user.id)

    return response.status(200).send(user)
  }

  public async login({ request, response }: Context) {
    const { email, password } = request.only(['email', 'password'])
    const token = await this.authService.login(email, password)

    return response.status(200).send({ token })
  }

  public async register({ request, response }: Context) {
    const user = await this.authService.register(
      request.only(['name', 'email', 'cellphone', 'password'])
    )

    return response.status(201).send(user)
  }

  public async confirm({ request, response }: Context) {
    await this.authService.confirm(request.query('token'))

    return response.status(204)
  }

  public async resetEmail({ request, response }: Context) {
    await this.authService.resetEmail(request.query('token'))

    return response.status(204)
  }

  public async resetPassword({ request, response }: Context) {
    await this.authService.resetPassword(request.query('token'))

    return response.status(204)
  }

  public async resetEmailPassword({ request, response }: Context) {
    await this.authService.resetEmailPassword(request.query('token'))

    return response.status(204)
  }
}
