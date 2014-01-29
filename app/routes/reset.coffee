Q       = require 'kew'
Auth    = require '../controllers/auth'
Storage = require '../controllers/storage'
page    = require '../utils/page'
Log     = require '../utils/log'
config  = require '../config'

log = Log 'Route -> Reset', 'yellow'

# -----------------------------------------------------------------------------
# Reset Password
# -----------------------------------------------------------------------------

resetPage = (req, res) ->
  res.sendfile page 'reset'

sendEmail = (req, res) ->
  email = req.body.email.toLowerCase()

  log email, 'wants to reset their password'

  Auth.createResetToken(email)
    .then (token) ->

      log email, 'get a token', token

      # link = "<a href=\"#{ config.url + '/reset' + token }\">Reset Password</a>"
      # Mail.send
      #   to: email
      #   subject: 'Nitro Password Reset'
      #   html: """
      #     <p>To reset your password, click the link below</p>
      #     <p>#{link}</p>
      #     <p>If you did not request your password to be reset, you can just ignore this email and your password will remain the same.</p>
      #     <p>- Nitrotasks</p>
      #   """

      if DEBUG
        res.send token
      else
        res.sendfile page 'reset_email'

    .fail (err) ->
      log err
      log email, 'do not get a token'
      res.status 400
      if DEBUG
        res.send 'error'
      else
        res.sendfile page 'error'

confirmToken = (req, res) ->
  token = req.params.token

  Storage.checkResetToken(token)
    .then ->
      res.sendfile page 'reset_form'
    .fail (err) ->
      if DEBUG
        res.send 'error'
      else
        res.sendfile page 'error'

resetPassword = (req, res) ->
  password = req.body.password
  confirmation = req.body.passwordConfirmation
  token = req.params.token

  log 'validating passwords for', token

  if password isnt confirmation
    log 'password mismatch'
    res.status 401
    res.sendfile page 'reset_mismatch'
    return

  Storage.checkResetToken(token)
    .then (id) ->
      log 'removing token', token
      Storage.destroyResetToken token
      Storage.get id
    .then (user) ->
      log 'changed password for', user.email
      Auth.changePassword user, password
    .then ->
      res.sendfile page 'reset_success'
    .fail (err) ->
      log err
      res.status 401
      res.send err


module.exports = [

  type: 'get'
  url: '/reset'
  handler: resetPage

,

  type: 'post'
  url: '/reset'
  handler: sendEmail

,


  type: 'get'
  url: '/reset/:token'
  handler: confirmToken

,

  type: 'post'
  url: '/reset/:token'
  handler: resetPassword

]
