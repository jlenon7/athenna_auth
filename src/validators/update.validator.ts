import { Middleware, type Context } from '@athenna/http'
import { BaseValidator } from '#src/validators/base.validator'

@Middleware({ name: 'update:validator' })
export class UpdateValidator extends BaseValidator {
  public schema = this.validator.object({
    name: this.validator.string().optional(),
    email: this.validator
      .string()
      .email()
      .unique({ table: 'users', max: 1 })
      .optional(),
    password: this.validator
      .string()
      .minLength(8)
      .maxLength(32)
      .confirmed()
      .optional()
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
