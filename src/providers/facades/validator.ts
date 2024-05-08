import { Facade } from '@athenna/ioc'
import type { ValidatorImpl } from '#src/helpers/validator'

export const Validator = Facade.createFor<ValidatorImpl>(
  'App/Helpers/Validator'
)
