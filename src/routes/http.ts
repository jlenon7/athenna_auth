import { Route } from '@athenna/http'

Route.group(() => {
  Route.group(() => {
    Route.get('users', 'UserController.index')
    Route.get('users/:id', 'UserController.show')
    Route.put('users/:id', 'UserController.update')
    Route.delete('users/:id', 'UserController.delete')
  }).middleware('auth')

  Route.post('users', 'UserController.store')
  Route.post('login', 'AuthController.login')
}).prefix('/api/v1')
