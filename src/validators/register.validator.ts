import { Middleware, type Context } from '@athenna/http'
import { BaseValidator } from '#src/validators/base.validator'

@Middleware({ name: 'register:validator' })
export class RegisterValidator extends BaseValidator {
  public definition = this.schema.object({
    name: this.schema.string(),
    email: this.schema.string().email(),
    password: this.schema.string().minLength(8).maxLength(32).confirmed()
  })

  public async handleHttp({ request }: Context): Promise<void> {
    const data = request.only([
      'name',
      'email',
      'password',
      'password_confirmation'
    ])

    await this.validate(data)
  }
}
