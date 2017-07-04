var express = require('express')
var router = express.Router()
var Web3 = require('web3')
var ct = require('../contracts')

router.get('/', function(req, res, next) {
  return res.json({health: 'ok'})
})

router.post('/create', function(req, res, next) {
  ct.setupAccount(req.body.email, (e, r) => {
    if (e) {
      console.log(e)
      return next(e)
    }

    console.log(r)
    return res.json(r)
  })
})

router.post('/update', function(req, res, next) {
  ct.updateProfile(req.body.email, req.body.account, req.body.priKey, req.body.profile, (e, r) => {
    if (e) {
      console.log(e)
      return next(e)
    }

    console.log(r)
    return res.json(r)
  })
})

router.post('/show', function(req, res, next) {
  ct.showProfile(req.body.email, req.body.account, (e, r) => {
    if (e) {
      console.log(e)
      return next(e)
    }

    console.log(r)
    return res.json(r)
  })
})

module.exports = router
