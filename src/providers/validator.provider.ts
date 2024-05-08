import { Is } from '@athenna/common'
import { Database } from '@athenna/database'
import { ServiceProvider } from '@athenna/ioc'
import type { FieldContext } from '@vinejs/vine/types'
import vine, { SimpleErrorReporter, VineString } from '@vinejs/vine'
import { ValidationException } from '#src/exceptions/validation.exception'

type UniqueOptions = {
  table: string
  column?: string
}

declare module '@vinejs/vine' {
  interface VineString {
    unique(options: UniqueOptions): this
  }
}

export class ErrorReporter extends SimpleErrorReporter {
  createError(): any {
    return new ValidationException(this.errors)
  }
}

export default class ValidatorProvider extends ServiceProvider {
  public async boot() {
    vine.errorReporter = () => new ErrorReporter()

    const uniqueRule = vine.createRule(this.unique)

    VineString.macro(
      'unique',
      function (this: VineString, options: UniqueOptions) {
        return this.use(uniqueRule(options))
      }
    )
  }

  public async unique(
    value: unknown,
    options: UniqueOptions,
    field: FieldContext
  ) {
    /**
     * We do not want to deal with non-string
     * values. The "string" rule will handle the
     * the validation.
     */
    if (!Is.String(value)) {
      return
    }

    if (!options.column) {
      options.column = field.name as string
    }

    const existsRow = await Database.table(options.table)
      .select(options.column)
      .where(options.column, value)
      .exists()

    if (existsRow) {
      field.report('The {{ field }} field is not unique', 'unique', field)
    }
  }
}
