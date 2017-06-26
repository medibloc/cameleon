var express = require('express')
var path = require('path')
var bodyParser = require('body-parser')
var ct = require('./contracts')

ct.init((e, r) => {
  if (e) {
    console.log("Error occurred during server initialization. T.T")
    console.log(e)
  }
})

var app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

var index = require('./routes/index')

app.use('/', index)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.json(err)
})

module.exports = app
