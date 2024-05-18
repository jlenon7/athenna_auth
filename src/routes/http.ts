import { Route } from '@athenna/http'

Route.view('/mailable', 'mail/confirm', { user: { name: 'João' } }).helmet({
  contentSecurityPolicy: false
})

Route.group(() => {
  Route.group(() => {
    Route.get('me', 'AuthController.me')

    Route.group(() => {
      Route.get('users', 'UserController.index').middleware('pagination')
      Route.get('users/:id', 'UserController.show')
      Route.put('users/:id', 'UserController.update').validator('user:update')
      Route.delete('users/:id', 'UserController.delete')
    }).name('users')
  }).middleware('auth')

  Route.get('confirm/account', 'AuthController.confirm')

  Route.get('reset/email', 'AuthController.resetEmail')
  Route.get('reset/password', 'AuthController.resetPassword')
  Route.get('reset/email/password', 'AuthController.resetEmailPassword')

  Route.post('login', 'AuthController.login').validator('user:login')
  Route.post('register', 'AuthController.register').validator('user:register')
})
  .prefix('/api/v1')
  .interceptor('response')
