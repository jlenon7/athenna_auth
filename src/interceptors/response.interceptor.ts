import { Interceptor } from '@athenna/http'
import type { InterceptorContract, InterceptContext } from '@athenna/http'

@Interceptor({ name: 'response' })
export class ResponseInterceptor implements InterceptorContract {
  public async intercept({ response }: InterceptContext): Promise<unknown> {
    return {
      status: response.statusCode,
      data: response.body
    }
  }
}
