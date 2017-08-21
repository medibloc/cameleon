const crypto = require('crypto')

const password = 'sodijfdsvlxkvnxvijpijf;lkfjqwlfkmnslxvi jxcvijpweifjew;fkqnflnf'
const seed = '23098usidsv09dsuvp3rh30hqpjtqknljbvc0xvpqi3tqkj3pt9u3lvnlvn'
const iteration = 99998
const keyLen = 32
const digest = 'sha512'

function encryptKey(key) {
  let kek = crypto.pbkdf2Sync(password, seed, iteration, keyLen, digest)
  let cipher = crypto.createCipher('aes256', kek, null)
  let encryptedKey = cipher.update(key, null, 'hex')
  encryptedKey += cipher.final('hex')

  return encryptedKey
}

function decryptKey(encryptedKey) {
  let kek = crypto.pbkdf2Sync(password, seed, iteration, keyLen, digest)
  let decipher = crypto.createDecipher('aes256', kek, null)
  let decryptedKey = decipher.update(encryptedKey, 'hex', 'hex')
  decryptedKey += decipher.final('hex')

  return Buffer.from(decryptedKey, 'hex')
}

module.exports = {
  encryptKey,
  decryptKey
}
