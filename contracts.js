const Web3 = require('web3')
const fs = require('fs')
const solc = require('solc')
const ethl = require('eth-lightwallet')
const Keystore = ethl.keystore
const tu = ethl.txutils
const sg = ethl.signing

var ks
var dkey

var web3
var ctrMap
var profiles

var Controller

function init(next) {
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  // web3.personal.unlockAccount(web3.eth.coinbase, "")

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

  deploy('CtrMap', [], (e, r) => {
    if (e) {return next(e)}
    var CtrMap = web3.eth.contract(r.abi)
    ctrMap = CtrMap.at(r.address)
  })

  deploy('Profiles', [], (e, r) => {
    if (e) {return next(e)}
    var Profiles = web3.eth.contract(r.abi)
    profiles = Profiles.at(r.address)
  })

  compile('Controller', (e, r) => {
    Controller = web3.eth.contract(r.abi)
  })
}

function compile(contract, next) {
  const input = fs.readFileSync('./contracts/' + contract + '.sol')
  const output = solc.compile(input.toString(), 1)
  if (output.errors !== undefined) {
    console.log('Compile error for ' + contract + ': ' + output.errors)
  } else {
    console.log('Just compiled ' + contract)
  }
  const abi = JSON.parse(output.contracts[':'+contract].interface)
  const bytecode = output.contracts[':'+contract].bytecode
  if (next) {
    return next(null, {abi: abi, bytecode: '0x' + bytecode})
  } else {
    return {abi: abi, bytecode: '0x' + bytecode}
  }
}

function deploy(contractName, constructorParams, next) {
  compile(contractName, (e, r) => {
    if (e) {return next(e)}

    var abi = r.abi
    var bytecode = r.bytecode

    const contract = web3.eth.contract(abi)
    const gasEstimate = web3.eth.estimateGas({data: bytecode})
    const contractInstance = contract.new(...constructorParams, {
        data: bytecode,
        from: web3.eth.coinbase,
        gas: 3000000
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
        }
      })
  })
}

function addEmail(email, controller, next) {
  ctrMap.update.sendTransaction(email, controller, {from: web3.eth.coinbase}, (e, r) => {
    console.log(e)
    console.log(r)
    hashStorage.hashes(account, (e, r) => {console.log(r)})
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

  deploy('Controller', [account], (e, r) => {
    if (e) {return next(e)}
    Controller = web3.eth.contract(r.abi)
    var controller = Controller.at(r.address)

    deploy('Recovery', [controller.address], (e, r) => {
      if (e) {return next(e)}
      Recovery = web3.eth.contract(r.abi)
      var recovery = Recovery.at(r.address)

      deploy('Proxy', [controller.address], (e, r) => {
        if (e) {return next(e)}
        ProxyContract = web3.eth.contract(r.abi)
        var proxy = ProxyContract.at(r.address)

        // let initialize = controller.initialize.getData(recovery.address, proxy.address)
        // return web3.eth.accounts.signTransaction({
        //   data: initialize,
        //   gas: web3.eth.estimateGas({data: initialize})
        // }, account.privateKey, next)

        var gasEstimate = web3.toWei(0.5, 'ether')

        let initializeTx = tu.functionTx(Controller.abi, 'initialize',
          [recovery.address, proxy.address], {
            nonce: '0x00',
            gasPrice: web3.eth.gasPrice.toString(),
            to: controller.address,
            value: '0x00'
          })

        console.log('initialize() tx(Unsigned): ' + initializeTx)

        let stx = sg.signTx(ks, dkey, initializeTx, account)
        console.log('Signed tx: ' + stx)
        console.log('Type of stx: ' + typeof stx)

        web3.eth.sendTransaction({from: web3.eth.coinbase, to: account, value: gasEstimate, gas: 100000}, (e, r) => {
          if (e) {return next(e)}

          web3.eth.sendRawTransaction(stx, (e, r) => {
            if (e) {return next(e)}
            console.log('Transaction Hash: ', r)
            next(null, {
              tx: r,
              key: ks.exportPrivateKey(account.substring(2), dkey)
            })
          })
        })
      })
    })
  })
}

function showAccount(email, priKey, next) {
  if (email === undefined || email === null || email.length == 0) {
    return next(new Error('Invalid Email.'))
  } else if (priKey === undefined || priKey === null || priKey.length != 64) {
    return next(new Error('Invalid private key.'))
  }

  ctrMap.controllers(email, (e, r) => {
    if (e) {return next(e)}
    console.log(r)

    var controller = Controller.at(r)
    let proxy = controller.proxy.getData()
    web3.eth.accounts.signTransaction({
      data: data,
      gas: web3.eth.estimateGas({data: data})
    }, priKey, (e, r) => {
      console.log(r)
    })

    profiles.profiles(proxy, (e, r) => {
      if (e) {
        console.log(e)
        return next(e)
      }

      return next(null, r)
    })

  })
}

module.exports = {
  init,
  setupAccount,
  showAccount
}
