import { Is } from '@athenna/common'
import { Database } from '@athenna/database'
import { Validate } from '@athenna/validator'
import { ServiceProvider } from '@athenna/ioc'

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

export default class ValidatorProvider extends ServiceProvider {
  public async boot() {
    Validate.extend().string('unique', async (value, options, field) => {
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
    })
  }
}
