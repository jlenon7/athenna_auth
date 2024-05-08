import type { SchemaTypes } from '@vinejs/vine/types'
import { Validator } from '#src/providers/facades/validator'

export abstract class BaseValidator {
  public validator = Validator.schema()

  public abstract schema: SchemaTypes
  public abstract handle(data: any): Promise<void>

  public validate(data: any) {
    return this.validator.validate({ schema: this.schema, data })
  }
}
