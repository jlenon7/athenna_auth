import { Is } from '@athenna/common'
import { Database } from '@athenna/database'
import { ServiceProvider } from '@athenna/ioc'
import { SimpleErrorReporter } from '@vinejs/vine'
import type { FieldContext } from '@vinejs/vine/types'
import { Validator } from '#src/providers/facades/validator'
import { ValidationException } from '#src/exceptions/validation.exception'

type UniqueOptions = {
  table: string
  column?: string
  max?: number
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
    Validator.schema().errorReporter = () => new ErrorReporter()

    Validator.extend(
      'unique',
      async (value: unknown, options: UniqueOptions, field: FieldContext) => {
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

        if (options.max) {
          const rows = await Database.table(options.table)
            .select(options.column)
            .where(options.column, value)
            .findMany()

          if (rows.length > options.max) {
            field.report('The {{ field }} field is not unique', 'unique', field)
          }

          return
        }

        const existsRow = await Database.table(options.table)
          .select(options.column)
          .where(options.column, value)
          .exists()

        if (existsRow) {
          field.report('The {{ field }} field is not unique', 'unique', field)
        }
      }
    )
  }
}
