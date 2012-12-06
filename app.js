// Generated by CoffeeScript 1.4.0
(function() {
  var app, express, http, io, port, server, storage;

  express = require('express');

  http = require('http');

  port = process.env.PORT || 5000;

  app = express();

  server = app.listen(port);

  io = require('socket.io').listen(server);

  app.configure(function() {
    return app.use(express["static"](__dirname + '/public'));
  });

  io.configure(function() {
    io.set("log level", 1);
    io.set("transports", ["xhr-polling"]);
    return io.set("polling duration", 10);
  });

  storage = {
    "username": {
      data: {
        Settings: [
          {
            "sort": true,
            "id": "c-0"
          }
        ],
        List: [
          {
            "name": "Some random list",
            "id": "c-0"
          }
        ],
        Task: [
          {
            "name": "# low That is awesome",
            "completed": false,
            "priority": 1,
            "list": "inbox",
            "id": "c-0"
          }, {
            "name": "#medium",
            "completed": false,
            "priority": 2,
            "list": "c-0",
            "id": "c-2"
          }, {
            "name": "#high",
            "completed": false,
            "priority": 3,
            "list": "c-0",
            "id": "c-4"
          }, {
            "name": "Just a test",
            "completed": false,
            "priority": 1,
            "list": "inbox",
            "id": "c-3"
          }
        ]
      }
    }
  };

  io.sockets.on('connection', function(socket) {
    var user;
    user = null;
    socket.on('fetch', function(data, fn) {
      var model, uname;
      uname = data[0], model = data[1];
      if (uname in storage) {
        user = storage[uname];
        return fn(user.data[model]);
      }
    });
    socket.on('create', function(data) {
      var item, model;
      model = data[0], item = data[1];
      console.log(model);
      switch (model) {
        case "Task":
          user.data.Task.push(item);
          break;
        case "List":
          user.data.List.push(item);
      }
      console.log(item.name);
      return socket.broadcast.emit('create', [model, item]);
    });
    socket.on('update', function(data) {
      var index, item, list, model, task, _i, _j, _len, _len1, _ref, _ref1;
      model = data[0], item = data[1];
      switch (model) {
        case "Task":
          _ref = user.data.Task;
          for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
            task = _ref[index];
            if (task.id === item.id) {
              break;
            }
          }
          user.data.Task[index] = item;
          break;
        case "List":
          _ref1 = user.data.Task;
          for (index = _j = 0, _len1 = _ref1.length; _j < _len1; index = ++_j) {
            list = _ref1[index];
            if (list.id === item.id) {
              break;
            }
          }
          user.data.List[index] = item;
      }
      console.log("Updated: " + item.name);
      return socket.broadcast.emit('update', [model, item]);
    });
    return socket.on('destroy', function(data) {
      var id, index, list, model, task, _i, _j, _len, _len1, _ref, _ref1;
      model = data[0], id = data[1];
      switch (model) {
        case "Task":
          _ref = user.data.Task;
          for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
            task = _ref[index];
            if (task.id === id) {
              break;
            }
          }
          user.data.Task.splice(index, 1);
          break;
        case "List":
          _ref1 = user.data.List;
          for (index = _j = 0, _len1 = _ref1.length; _j < _len1; index = ++_j) {
            list = _ref1[index];
            if (list.id === id) {
              break;
            }
          }
          user.data.List.splice(index, 1);
      }
      console.log("Item " + id + " has been destroyed");
      return socket.broadcast.emit('destroy', [model, id]);
    });
  });

}).call(this);
