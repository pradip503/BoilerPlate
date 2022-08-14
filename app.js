var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var exphs = require('express-handlebars');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//set default engine
app.set('view engine', 'handlebars');
app.engine(
  'handlebars',
  exphs({
    defaultLayout: 'index',
    helpers: {},
  }),
);

app.use('/', indexRouter);
app.use('/users', usersRouter);

// set port
const PORT = process.env.PORT || 4500;

// listen to server
app.listen(PORT, (error) => {
  if (error) {
    console.log(error);
  } else {
    console.log('Listening on port ' + PORT);
  }
});

module.exports = app;
