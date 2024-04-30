import { Route } from '@athenna/http'

Route.view('/mailable', 'mail/register', { user: { name: 'João' } }).helmet({
  contentSecurityPolicy: false
})

Route.group(() => {
  Route.group(() => {
    Route.get('me', 'AuthController.me')

    Route.group(() => {
      Route.get('users', 'UserController.index').middleware('pagination')
      Route.get('users/:id', 'UserController.show')
      Route.put('users/:id', 'UserController.update')
      Route.delete('users/:id', 'UserController.delete')
    }).name('users')
  }).middleware('auth')

  Route.get('verify-email', 'AuthController.verifyEmail')
  Route.post('login', 'AuthController.login').middleware('login:validator')
  Route.post('register', 'AuthController.register').middleware(
    'register:validator'
  )
})
  .prefix('/api/v1')
  .interceptor('response')
