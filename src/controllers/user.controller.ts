import { Inject } from '@athenna/ioc'
import { Controller, type Context } from '@athenna/http'
import type { UserService } from '#src/services/user.service'

@Controller()
export class UserController {
  @Inject()
  public userService: UserService

  public async index({ response }: Context) {
    const users = await this.userService.getAll()

    return response.status(200).send(users)
  }

  public async show({ request, response }: Context) {
    const user = await this.userService.getById(request.param('id'))

    return response.status(200).send(user)
  }

  public async update({ request, response }: Context) {
    const user = await this.userService.update(
      request.param('id'),
      request.body
    )

    return response.status(200).send(user)
  }

  public async delete({ request, response }: Context) {
    await this.userService.delete(request.param('id'))

    return response.status(204)
  }
}
