import { Test, type Context } from '@athenna/test'
import { BaseHttpTest } from '@athenna/core/testing/BaseHttpTest'

export default class UserControllerTest extends BaseHttpTest {
  @Test()
  public async shouldBeAbleToGetAllUsers({ request }: Context) {
    const response = await request.get('/')

    response.assertStatusCode(200)
    response.assertBodyContains({
      name: '@athenna/athenna',
      version: '1.0.0',
      source: 'https://github.com/AthennaIO',
      description: 'Athenna is awesome!'
    })
  }
}