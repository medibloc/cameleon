var ipfsAPI = require('ipfs-api')
const concat = require('concat-stream')

// connect to ipfs daemon API server
var ipfs = ipfsAPI('localhost', '5001', {protocol: 'http'})

function upload(data, fileName, callback) {
  if (typeof data === 'object') {
    data = JSON.stringify(data)
  }
  const arr = []
  const filePair = {
    path: fileName,
    content: data
  }

  arr.push(filePair)
  ipfs.files.add(arr, (e, r) => {
    if (e) {return callback(e)}
    let file = r[0]
    callback(null, file.hash)
  })
}

function get(hash, callback) {
  ipfs.files.get(hash, (err, stream) => {
    if (stream === undefined) {
      console.log(err)
      callback(err, '')
    } else {
      stream.on('data', (file) => {
        file.content.pipe(concat((content) => {
          callback(err, content.toString())
        }))
      })
    }
  })
}

module.exports = {
  upload,
  get
}
