import vine, { type Vine } from '@vinejs/vine'
import type { SchemaTypes } from '@vinejs/vine/types'

export abstract class BaseValidator {
  protected validator: Vine = vine

  public abstract schema: SchemaTypes
  public abstract handle(data: any): Promise<void>

  public validate(data: any) {
    return this.validator.validate({ schema: this.schema, data })
  }
}
