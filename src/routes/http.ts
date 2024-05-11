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
      Route.put('users/:id', 'UserController.update').validator('user:update')
      Route.delete('users/:id', 'UserController.delete')
    }).name('users')
  }).middleware('auth')

  Route.get('confirm/account', 'AuthController.confirm')
  Route.get('confirm/email', 'AuthController.confirmEmailChange')
  Route.get('confirm/password', 'AuthController.confirmPasswordChange')
  Route.get(
    'confirm/email/password',
    'AuthController.confirmEmailPasswordChange'
  )

  Route.post('login', 'AuthController.login').validator('user:login')
  Route.post('register', 'AuthController.register').validator('user:register')
})
  .prefix('/api/v1')
  .interceptor('response')
