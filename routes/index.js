var express = require('express')
var router = express.Router()
var Web3 = require('web3')
var ct = require('../contracts')

router.get('/', function(req, res, next) {
  return res.json({health: 'ok'})
})

router.post('/create', function(req, res, next) {
  ct.setupAccount(req.body.email, (e, r) => {
    console.log('1')
    if (e) {
      console.log('2')
      console.log(e)
      return next(e)
    }

    console.log('3')
    console.log(r)
    return res.json(r)
  })
})

router.post('/show/:email', function(req, res, next) {
  ct.showAccount(req.email, req.body.priKey, (e, r) => {
    if (e) {return next(e)}

    console.log(r)
    return res.json(r)
  })
})

module.exports = router
