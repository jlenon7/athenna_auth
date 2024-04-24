import { Middleware } from '@athenna/http'
import type { PaginationOptions } from '@athenna/common'
import type { Context, MiddlewareContract } from '@athenna/http'

@Middleware({ name: 'pagination' })
export class PaginationMiddleware implements MiddlewareContract {
  public async handle({ data, request }: Context): Promise<void> {
    data.pagination = {
      page: parseInt(request.query('page', '0')),
      limit: parseInt(request.query('limit', '10')),
      resourceUrl: request.baseHostUrl
    } as PaginationOptions
  }
}
