var express = require('express')
var router = express.Router()
var Web3 = require('web3')
var ct = require('../contracts')
var hi = require('../histories')

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
  ct.updateProfile(req.body.email, req.body.account, req.body.priKey, req.body.profile,
    (e, r) => {
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

router.post('/search_by_email', function(req, res, next) {
  ct.searchByEmail(req.body.email, (e, r) => {
    if (e) {
      console.log(e)
      return next(e)
    }

    console.log(r)
    return res.json(r)
  })
})

router.post('/register', function(req, res, next) {
  ct.approveDoctor(req.body.email, req.body.account, req.body.institution, req.body.role,
    (e, r) => {
      if (e) {
        console.log(e)
        return next(e)
      }

      console.log('Doctor registration result: ' + r)
      return res.json(r)
    })
})

router.post('/history', function(req, res, next) {
  ct.addHistory(req.body.patient, req.body.author, req.body.content,
    (e, r) => {
      if (e) {
        console.log(e)
        return next(e)
      }

      return res.json(r)
    })
})

router.post('/histories', function(req, res, next) {
  ct.getHistories(req.body.email, req.body.account, req.body.priKey, (e, r) => {
    if (e) {
      console.log(e)
      return next(e)
    }

    console.log('History returning: ' + r)

    return res.json(r)
  })
})

router.post('/request_history_upload', function(req, res, next) {
  hi.requestUpload(req.body.content, req.body.owner, req.body.author, (e, r) => {
    if (e) {
      console.log(e)
      return next(e)
    }

    return res.json(r)
  })
})

module.exports = router
