shrink   = require './shrink'
keychain = require './keychain'
connect  = require './connect'
Q        = require 'kew'
Log      = require('./log')('Database', 'blue')

db = null

connected = connect.ready.then ->

  Log 'Connecting to MySQL'

  db = connect.mysql

  deferred = Q.defer()

  db.connect  (err) ->
    if err
      Log 'Error while connecting!'
      deferred.reject err
    Log 'Connected to MySQL server'
    setup()
    deferred.resolve()

  return deferred.promise

# Initialise Nitro database
setup = ->

  # Create 'users' table
  db.query '''
    CREATE TABLE IF NOT EXISTS `users` (
     `id`            int(11)        NOT NULL    AUTO_INCREMENT,
     `name`          varchar(100)   NOT NULL,
     `email`         varchar(100)   NOT NULL,
     `password`      char(60)       NOT NULL,
     `pro`           tinyint(1)     NOT NULL,
     `data_task`     mediumblob     NOT NULL,
     `data_list`     mediumblob     NOT NULL,
     `data_setting`  mediumblob     NOT NULL,
     `data_time`     mediumblob     NOT NULL,
     `index_task`    int(11)        NOT NULL    DEFAULT '0',
     `index_list`    int(11)        NOT NULL    DEFAULT '0',
     `created_at`    timestamp      NOT NULL    DEFAULT '0000-00-00 00:00:00',
     `updated_at`    timestamp      NOT NULL    DEFAULT CURRENT_TIMESTAMP       ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
  '''

# Close database connection
close = ->
  db.end()

query = (sql...) ->
  Q.bindPromise db.query, db, sql

# ---

# Add or update user details
write_user = (user) ->

  deferred = Q.defer()

  data = {}

  # Only update the properties set in `user`

  for property in ['id', 'name', 'email', 'password', 'pro', 'created_at', 'updated_at']
    if user.hasOwnProperty(property)
      data[property] = user[property]

  for property in ['task', 'list', 'setting', 'time']
    property = 'data_' + property
    if user.hasOwnProperty(property)
      data[property] = shrink.pack(user[property])

  for property in ['task', 'list']
    property = 'index_' + property
    if user.hasOwnProperty(property)
      data[property] = user[property]

  # Write to database
  db.query 'INSERT INTO users SET ? ON DUPLICATE KEY UPDATE ?', [data, data], (err, result) ->
    if err then return deferred.reject(err)

    Log "Wrote user #{ result.insertId }"

    # Return the user id
    deferred.resolve result.insertId

  return deferred.promise


# Get user data
read_user = (uid) ->

  Log "Fetching user #{uid}"

  deferred = Q.defer()

  db.query 'SELECT * FROM users WHERE id=?', uid, (err, result) ->
    if err then return deferred.reject(err)

    if result.length is 0
      return deferred.reject()

    user = result[0]

    user.data_task    = shrink.unpack user.data_task
    user.data_list    = shrink.unpack user.data_list
    user.data_setting = shrink.unpack user.data_setting
    user.data_time    = shrink.unpack user.data_time

    deferred.resolve(user)

  return deferred.promise

all_users = ->
  deferred = Q.defer()
  db.query 'SELECT id, name, email FROM users', deferred.makeNodeResolver()
  return deferred.promise

# Delete user data
del_user = (uid) ->
  deferred = Q.defer()
  db.query 'DELETE FROM users WHERE id = ?', uid, deferred.makeNodeResolver()
  deferred.then ->
    Log 'Deleted user', uid


truncate = (table) ->
  sql = "TRUNCATE #{ table }"
  query sql

# Remove user
# Update user details
# Set task, list and timestamp data

module.exports =
  connected: connected
  close: close
  query: query
  truncate: truncate
  user:
    all: all_users
    write: write_user
    read: read_user
    delete: del_user
