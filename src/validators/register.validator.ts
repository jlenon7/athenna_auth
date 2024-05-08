import { Middleware, type Context } from '@athenna/http'
import { BaseValidator } from '#src/validators/base.validator'

@Middleware({ name: 'register:validator' })
export class RegisterValidator extends BaseValidator {
  public schema = this.validator.object({
    name: this.validator.string(),
    email: this.validator.string().email().unique({ table: 'users' }),
    password: this.validator.string().minLength(8).maxLength(32).confirmed()
  })

  public async handle({ request }: Context) {
    const data = request.only([
      'name',
      'email',
      'password',
      'password_confirmation'
    ])

    await this.validate(data)
  }
}
