import { Service } from '@athenna/ioc'
import vine, { VineString } from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'

@Service({ alias: 'App/Helpers/Validator' })
export class ValidatorImpl {
  public schema() {
    return vine
  }

  public extend(
    name: string,
    handler: (
      value: unknown,
      options: any,
      field: FieldContext
    ) => any | Promise<any>
  ) {
    const rule = vine.createRule(handler)

    VineString.macro(name, function (this: VineString, options: any) {
      return this.use(rule(options))
    })

    return this
  }
}
