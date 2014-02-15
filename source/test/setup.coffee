config   = require('../config')
core     = require('../core/index')
database = require('../core/controllers/database')
Users    = require('../core/models/user')

# -----------------------------------------------------------------------------
# Setup
# -----------------------------------------------------------------------------

global.DEBUG = true
global.DEBUG_ROUTES = true

enviroment = process.env.NODE_ENV ?= 'testing'
config.use(enviroment)

setup = ->

  core(config)
  .then(database.resetTables)
  .return(setup)

setup._user =
  name: 'user_name'
  email: 'user_email'
  password: 'user_password'
  pro: 0

setup._pref =
  sort: 0
  night: 0
  language: 'en-us'
  weekStart: 0
  dateFormat: 'dd/mm/yy'
  confirmDelete: 0
  moveCompleted: 0

setup._list =
  name: 'list_name'

setup._task =
  name: 'task_name'
  notes: 'task_notes'
  date: 0
  priority: 0
  completed: 0

setup._login =
  token: 'login_token'

setup.createUser = ->

  Users.create(setup._user)
  .then (user) ->
    setup.user = user
    setup.userId = user.id

setup.createPref = ->

  setup._pref.userId = setup.userId

  setup.user.pref.create(setup._pref)
  .then (id) ->
    setup.prefId = id

setup.createList = ->

  setup.user.lists.create(setup._list)
  .then (id) ->
    setup.listId = id

setup.createTask = ->

  setup._task.listId = setup.listId

  setup.user.tasks.create(setup._task)
  .then (id) ->
    setup.taskId = id
    database.list_tasks.create(setup.listId, id)

setup.createLogin = ->

  setup._login.id = setup.userId

  database.login.create(setup._login.id, setup._login.token)
  .then (id) ->
    setup.loginId = id

module.exports = setup