var socketIo = require('socket.io-client')
const ks = require('./keys')
var mongoose = require('mongoose')
var User = mongoose.model('User')
var History = mongoose.model('History')
var HistoryUploadRequest = mongoose.model('HistoryUploadRequest')

function saveHistoryKey(ownerAccount, historyIndex, key, next) {
  User.findOne({_id: ownerAccount}).exec((e, r) => {
    if (e) {
      console.log(e)
      let user = new User({_id: ownerAccount})
      user.save((e) => {
        if (e) {
          console.log('Error occurred while saving user info: ' + e)
          return next(e)
        } else {
          let history = new History({
            index: historyIndex,
            _owner: user._id,
            encKey: ks.encryptKey(key)
          })

          history.save((e, r) => {
            if (e) {
              console.log('Error occurred while saving history key info: ' + e)
            } else {
              return next(null, r)
            }
          })
        }
      })
    } else {
      let history = new History({
        index: historyIndex,
        _owner: ownerAccount,
        encKey: ks.encryptKey(key)
      })

      history.save((e, r) => {
        if (e) {
          console.log('Error occurred while saving history key info: ' + e)
        } else {
          return next(null, r)
        }
      })
    }
  })
}

function loadHistoryKey(ownerAccount, historyIndex, next) {
  History.findOne({_owner: ownerAccount, index: historyIndex}).exec((e, r) => {
    if (e) {
      console.log('Error occurred while loading history info: ' + e)
      return next(e)
    }

    console.log('Fetched history object: ' + JSON.stringify(r))
    let key = ks.decryptKey(r.encKey)
    return next(null, key)
  })
}

function requestUpload(content, owner, author, next) {
  let hur = new HistoryUploadRequest(Object.assign(content, {owner, author}))
  hur.save((e, r) => {
    if (e) {
      console.log('Error occurred while saving history request')
      return next(e)
    }

    console.log('History to request uploading: ' + JSON.stringify(r))

    let socketClient = socketIo('http://localhost:7080')

    socketClient.emit('action', {
      type: 'REQUEST_HISTORY_UPLOAD',
      history: r
    })
    return next(null, r)
  })
}

function getUploadRequest(id, next) {
  HistoryUploadRequest.findOne({_id: id}).exec((e, r) => {
    if (e) {
      console.log('Error finding history upload request')
      return next(e)
    }

    return next(null, r)
  })
}

function removeUploadRequest(id, next) {
  HistoryUploadRequest.remove({_id: id}, (e) => {
    if (e) {
      console.log('Error while finding history upload request')
      return next(e)
    }

    return next(null)
  })
}

module.exports = {
  saveHistoryKey,
  loadHistoryKey,
  requestUpload,
  getUploadRequest,
  removeUploadRequest
}
