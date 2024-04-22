import type { Context } from '@athenna/http'
import vine, { type Vine } from '@vinejs/vine'
import type { SchemaTypes } from '@vinejs/vine/types'
import { ValidationException } from '#src/exceptions/validation.exception'

export abstract class BaseValidator {
  public abstract definition: SchemaTypes
  public abstract handleHttp(ctx: Context): Promise<void>

  protected schema: Vine = vine

  public handle(ctx: Context): Promise<void> {
    return this.handleHttp(ctx)
  }

  protected async validate(data: any) {
    try {
      await vine.validate({ schema: this.definition, data })
    } catch (err) {
      throw new ValidationException(err)
    }
  }
}
