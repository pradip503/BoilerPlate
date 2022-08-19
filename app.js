var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var exphs = require('express-handlebars');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var cluster = require('cluster');

// listen to server
// app.listen(PORT, (error) => {
//   if (error) {
//     console.log(error);
//   } else {
//     console.log('Listening on port ' + PORT);
//   }
// });

if (cluster.isMaster) {
  var numWorkers = require('os').cpus().length;

  console.log('Master cluster setting up ' + numWorkers + ' workers...');

  for (var i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('online', function (worker) {
    console.log('Worker ' + worker.process.pid + ' is online');
  });

  cluster.on('exit', function (worker, code, signal) {
    console.log(
      'Worker ' +
        worker.process.pid +
        ' died with code: ' +
        code +
        ', and signal: ' +
        signal,
    );
    console.log('Starting a new worker');
    cluster.fork();
  });
} else {
  var app = require('express')();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));

  //set default engine
  app.set('view engine', 'handlebars');
  app.engine(
    'handlebars',
    exphs({
      defaultLayout: '',
      helpers: {},
    }),
  );

  app.use('/', indexRouter);
  app.use('/users', usersRouter);

  // set port
  const PORT = process.env.PORT || 4500;

  app.listen(PORT, function () {
    console.log(
      'Process ' + process.pid + ' is listening to all incoming requests',
    );
  });
}

module.exports = app;
