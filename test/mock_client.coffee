# Generate strings for Jandal

emit = (event, args...) ->
  string = event

  string += '('
  string += JSON.stringify(args)[1...-1]
  string += ')'

  if client.callback
    string += '.fn('
    string += ++client.id
    string += ')'

  if client.socket
    client.socket.reply string

  return string

client =

  id: -1
  callback: true
  socket: null

  setId: (id) ->
    client.id = id - 1

  queue:

    sync: (queue, time) ->
      emit 'queue.sync', queue, time

  user:

    auth: (id, token) ->
      emit 'user.auth', id, token

    info: ->
      emit 'user.info'

  task:

    fetch: ->
      emit 'task.fetch'

    create: (model, ts) ->
      emit 'task.create', model

    update: (model) ->
      emit 'task.update', model

    destroy: (model) ->
      emit 'task.destroy', model

  list:

    fetch: ->
      emit 'list.fetch'

    create: (model) ->
      emit 'list.create', model

    update: (model) ->
      emit 'list.update', model

    destroy: (model) ->
      emit 'list.destroy', model

  pref:

    fetch: ->
      emit 'pref.fetch'

    update: (model) ->
      emit 'pref.update', model


module.exports = client
