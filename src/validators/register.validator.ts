import { type Context } from '@athenna/http'
import { Validator, BaseValidator } from '@athenna/validator'

@Validator({ name: 'user:register' })
export class RegisterValidator extends BaseValidator {
  public schema = this.validator.object({
    name: this.validator.string(),
    cellphone: this.validator.string().optional(),
    email: this.validator.string().email().unique({ table: 'users' }),
    password: this.validator.string().minLength(8).maxLength(32).confirmed()
  })

  public async handle({ request }: Context) {
    const data = request.only([
      'name',
      'email',
      'cellphone',
      'password',
      'password_confirmation'
    ])

    await this.validate(data)
  }
}
