import { Parser } from '@athenna/common'
import { Interceptor } from '@athenna/http'
import type { InterceptorContract, InterceptContext } from '@athenna/http'

@Interceptor({ name: 'response' })
export class ResponseInterceptor implements InterceptorContract {
  public async intercept({
    request,
    response
  }: InterceptContext): Promise<unknown> {
    const body: any = {
      status: response.statusCode,
      code: Parser.statusCodeToReason(response.statusCode),
      baseUrl: request.baseUrl,
      responseTime: response.responseTime
    }

    if (response.body?.meta && response.body?.links) {
      body.meta = response.body.meta
      body.links = response.body.links
      body.data = response.body.data

      return body
    }

    body.data = response.body

    return body
  }
}
