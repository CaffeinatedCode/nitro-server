express = require('express')
cors    = require('cors')
log     = require('log_')('Router', 'magenta')
jwt     = require('express-jwt')

app = express()

app.configure ->

  # Parse POST requests
  app.use express.json()
  app.use express.urlencoded()

  # Allow Cross-Origin Resource Sharing
  app.use cors()

  # Protect api
  app.use '/api', jwt(secret: 'secret')


# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------

routes = [
  'api'
  'login'
  'register'
  'reset'
  'root'
  '404'
  # 'oauth'
  # 'payment'
]

# Bind an array of routes to the server
for route in routes
  route = require '../routes/' + route
  for path in route
    if path.type is 'get'
      log 'GET ', path.url
    else
      log 'POST', path.url
    app[path.type] path.url, path.handler


module.exports = app
