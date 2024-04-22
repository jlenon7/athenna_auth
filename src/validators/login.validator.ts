import { Middleware, type Context } from '@athenna/http'
import { BaseValidator } from '#src/validators/base.validator'

@Middleware({ name: 'login:validator' })
export class LoginValidator extends BaseValidator {
  public definition = this.schema.object({
    email: this.schema.string().email(),
    password: this.schema.string()
  })

  public async handleHttp({ request }: Context): Promise<void> {
    const data = request.only(['email', 'password'])

    await this.validate(data)
  }
}
