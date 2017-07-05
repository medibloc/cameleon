const Web3 = require('web3')
const fs = require('fs')
const solc = require('solc')
const ethl = require('eth-lightwallet')
const etx = require('ethereumjs-tx')
const Keystore = ethl.keystore
const tu = ethl.txutils
const sg = ethl.signing
const di = require('./data-interface')

var ks
var dkey

var web3
var ctrMap
var profiles

var Controller
var ProxyContract

function init(next) {
  console.log('Init called')
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
  web3.personal.unlockAccount(web3.eth.coinbase, "")

  var password = 'medibloc'
  Keystore.createVault({password: password}, (e, r) => {
    if (e) {return next(e)}

    ks = r
    ks.keyFromPassword(password, (e, r) => {
      if (e) {return next(e)}

      dkey = r

      if (!ks.isDerivedKeyCorrect(dkey)) {
        console.log('************ Something went wrong during key setup ************')
      }
    })
  })

  deploy('CtrMap', [], null, (e, r) => {
    if (e) {return next(e)}
    var CtrMap = web3.eth.contract(r.abi)
    ctrMap = CtrMap.at(r.address)

    deploy('Profiles', [], null, (e, r) => {
      if (e) {return next(e)}
      var Profiles = web3.eth.contract(r.abi)
      profiles = Profiles.at(r.address)
    })
  })

  compile('Controller', 'Proxy', (e, r) => {
    Controller = web3.eth.contract(r.abi)
  }, 'Proxy')

  compile('Proxy', null, (e, r) => {
    ProxyContract = web3.eth.contract(r.abi)
  })
}

function compile(contract, imported, next) {
  let output = undefined

  if (imported === undefined || imported === null) {
    const input = fs.readFileSync('./contracts/' + contract + '.sol')
    output = solc.compile(input.toString(), 1)
    var findContract = ':' + contract
  } else {
    let inputs = {
      [imported + '.sol']: fs.readFileSync('./contracts/' + imported + '.sol').toString(),
      [contract + '.sol']: fs.readFileSync('./contracts/' + contract + '.sol').toString()
    }
    output = solc.compile({sources: inputs}, 1)
    var findContract = contract + '.sol:' + contract
  }
  if (output.errors !== undefined) {
    console.log('Compile error for ' + contract + ': ' + output.errors)
  } else {
    console.log('Just compiled ' + contract)
  }
  const abi = JSON.parse(output.contracts[findContract].interface)
  const bytecode = output.contracts[findContract].bytecode
  if (next) {
    return next(null, {abi: abi, bytecode: '0x' + bytecode})
  } else {
    return {abi: abi, bytecode: '0x' + bytecode}
  }
}

function deploy(contractName, constructorParams, imported, next) {
  web3.personal.unlockAccount(web3.eth.coinbase, "")
  console.log('Deploy of ' + contractName + ' called')
  compile(contractName, imported, (e, r) => {
    if (e) {return next(e)}

    var abi = r.abi
    var bytecode = r.bytecode

    const contract = web3.eth.contract(abi)
    const gasEstimate = web3.eth.estimateGas({data: bytecode})
    const contractInstance = contract.new(...constructorParams, {
        data: bytecode,
        from: web3.eth.coinbase,
        gas: 4712388
      }, (err, res) => {
        if (err) {
            console.log('Deploy failed: ' + err)
            return next(new Error('Failed to deploy'))
        }

        // Log the tx, you can explore status with eth.getTransaction()
        console.log('Deploy transaction hash of ' + contractName + ': ' + res.transactionHash)

        // If we have an address property, the contract was deployed
        if (res.address) {
            console.log('Contract address of ' + contractName + ': ' + res.address)
            next(null, {abi: abi, address: res.address})
        } else {
          console.log('Contract ' + contractName + ' not successfully deployed')
        }
      })
  })
}

function addEmail(email, controller, next) {
  ctrMap.update.sendTransaction(email, controller, {from: web3.eth.coinbase}, (e, r) => {
    console.log(e)
    console.log(r)
    console.log(ctrMap.get(email))
    next(e, r)
  })
}

function setupAccount(email, next) {
  console.log('setup')
  if (email === undefined || email === null || email.length == 0) {
    return next(new Error('Invalid Email.'))
  }

  ks.generateNewAddress(dkey)
  let addresses = ks.getAddresses()
  account = '0x' + addresses[addresses.length - 1]
  console.log('Created account: ' + account)

  deploy('Controller', [account], 'Proxy', (e, r) => {
    if (e) {return next(e)}
    Controller = web3.eth.contract(r.abi)
    var controller = Controller.at(r.address)

    addEmail(email, controller.address, (e, r) => {
      if (e) {return next(e)}

      deploy('Recovery', [controller.address], null, (e, r) => {
        if (e) {return next(e)}
        Recovery = web3.eth.contract(r.abi)
        var recovery = Recovery.at(r.address)
        console.log('Recovery: ' + recovery.address)

        deploy('Proxy', [controller.address], null, (e, r) => {
          if (e) {return next(e)}
          var proxy = ProxyContract.at(r.address)
          console.log('Proxy: ' + proxy.address)

          controller.getUser((e, r) => {
            console.log('Controller\'s owner: ' + r)
            console.log('Account: ' + account)
          })

          let gasEstimate = web3.toWei(0.2, 'ether')

          let controllerInitializeData = controller.initialize.getData(recovery.address, proxy.address)
          let priKey = ks.exportPrivateKey(account.substring(2), dkey)
          let keyBuffer = new Buffer(priKey, 'hex')

          let rawTx = {
            nonce: web3.toHex(web3.eth.getTransactionCount(account)),
            to: controller.address,
            from: account,
            gasPrice: web3.toHex(web3.eth.gasPrice),
            gasLimit: '0x47E7C4',
            value: '0x00',
            data: controllerInitializeData
          }

          let tx = new etx(rawTx)
          tx.sign(keyBuffer)

          let serializedTx = tx.serialize()
          let stx = '0x' + serializedTx.toString('hex')

          console.log('Signed tx: ' + stx)
          console.log('Type of stx: ' + typeof stx)

          web3.eth.sendTransaction({from: web3.eth.coinbase, to: account, value: gasEstimate},
            (e, r) => {
              if (e) {return next(e)}
              console.log('Sent gas fee to the new account!')

              web3.eth.sendRawTransaction(stx, (e, r) => {
                if (e) {return next(e)}
                console.log('Transaction Hash: ', r)
                controller.getProxy((e, r) => {console.log('Proxy: ' + r)})
                controller.getRecovery((e, r) => {console.log('Recovery: ' + r)})
                return next(null, {
                  tx: r,
                  account: account,
                  key: priKey
                })
              })
            })
        })
      })
    })
  })
}

function updateProfile(email, account, priKey, profile, next) {
  console.log('Account: ' + account)
  let fileName = 'mb_' + email + '_' + Date.now() + '.json'
  di.upload(profile, fileName, (e, r) => {
    if (e) {
      console.log('Error occurred during IPFS upload!! : ' + e)
      return next(e)
    }
    console.log('Email: ' + email)

    console.log(r)
    var ipfsHash = r
    console.log('IPFS Hash got: ' + ipfsHash)

    ctrMap.get(email, {from: web3.eth.coinbase}, (e, r) => {
      if (e) {return next(e)}

      if (r === '0x0000000000000000000000000000000000000000') {
        return next(new Error('Cannot find a controller for the user account'))
      }

      var controllerAddr = r
      console.log('Controller: ' + controllerAddr)
      let profileUpdateData = profiles.update.getData(ipfsHash)
      let controller = Controller.at(controllerAddr)
      controller.getProxy((e, r) => {console.log('Proxy: ' + r)})
      controller.getRecovery((e, r) => {console.log('Recovery: ' + r)})

      let controllerForwardData = controller.forward.getData(profiles.address, 0x00, profileUpdateData)
      let keyBuffer = new Buffer(priKey, 'hex')

      let rawTx = {
        data: controllerForwardData,
        nonce: web3.toHex(web3.eth.getTransactionCount(account)),
        to: controllerAddr.toString(),
        from: account,
        gasPrice: web3.toHex(web3.eth.gasPrice),
        gasLimit: '0x47E7C4',
        value: '0x00'
      }

      var tx = new etx(rawTx)
      tx.sign(keyBuffer)

      var serializedTx = tx.serialize()
      var stx = '0x' + serializedTx.toString('hex')

      console.log('Signed tx: ' + stx)
      console.log('Type of stx: ' + typeof stx)

      var gasEstimate = web3.toWei(0.2, 'ether')

      web3.eth.sendTransaction({
        from: web3.eth.coinbase,
        to: account,
        value: gasEstimate
      }, (e, r) => {
        if (e) {
          console.log('Error while transfering gas fee to user: ' + e)
          return next(e)
        }

        if (e) {
          console.log('Error while transfering gas fee to controller: ' + e)
          return next(e)
        }

        let controllerForwarded = controller.Forwarded({data: profileUpdateData})
        controllerForwarded.watch((e, r) => {
          if (e) {
            console.log('********** [Controller] <<<Error>>> occurred in forwarding: ' + e)
          } else {
            console.log('********** [Controller] Fowarding result: ' + r)
          }
          controllerForwarded.stopWatching()
        })

        var ret = {}
        controller.getProxy((e, r) => {
          let proxy = ProxyContract.at(r)
          let forwarded = proxy.Forwarded({data: profileUpdateData})
          forwarded.watch((e, r) => {
            if (e) {
              console.log('********** [Proxy] <<<Error>>> occurred in forwarding: ' + e)
              return next(e)
            } else {
              console.log('********** [Proxy] Fowarding result: ' + r)
            }
            forwarded.stopWatching()
            return next(null, ret)
          })

          web3.eth.sendRawTransaction(stx, (e, r) => {
            if (e) {
              console.log('Error while processing update transaction: ' + e)
              return next(e)
            }
            console.log('Transaction Hash: ', r)

            ret.tx = r
          })
        })
      })
    })
  })
}

function showProfile(email, account, next) {
  ctrMap.get(email, {from: web3.eth.coinbase}, (e, r) => {
    if (e) {return next(e)}

    if (r === '0x0000000000000000000000000000000000000000') {
      return next(new Error('Cannot find a controller for the user account'))
    }

    var controllerAddr = r
    console.log('Controller: ' + controllerAddr)

    let controller = Controller.at(controllerAddr)

    controller.getProxy((e, r) => {
      if (e) {
        console.log('Error occurred getting proxy address')
        return next(e)
      }

      profiles.profiles(r, (e, r) => {
        let hash = r
        console.log('IPFS Hash: ' + hash)

        di.get(hash, (e, r) => {
          if (e) {
            console.log('Error occurred getting profile data from IPFS')
            return next(e)
          }

          console.log('IPFS Data: ' + r)
          return next(null, JSON.parse(r))
        })
      })
    })
  })
}

module.exports = {
  init,
  setupAccount,
  updateProfile,
  showProfile
}
