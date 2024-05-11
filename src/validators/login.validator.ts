import { type Context } from '@athenna/http'
import { Validator, BaseValidator } from '@athenna/validator'

@Validator({ name: 'user:login' })
export class LoginValidator extends BaseValidator {
  public schema = this.validator.object({
    email: this.validator.string().email(),
    password: this.validator.string()
  })

  public async handle({ request }: Context) {
    const data = request.only(['email', 'password'])

    await this.validate(data)
  }
}
