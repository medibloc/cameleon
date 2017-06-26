pragma solidity ^0.4.11;

contract Controller {
    uint private version;
    address user;
    address recovery;
    address proxy;

    modifier onlyRecovery() {
      if (msg.sender == recovery)
        _;
    }

    modifier onlyUser() {
      if (msg.sender == user)
        _;
    }

    function Controller(address _user) {
      version = 0;
      user = _user;
    }

    function initialize(address recoveryAddr, address proxyAddr) onlyUser {
      recovery = recoveryAddr;
      proxy = proxyAddr;
    }

    function getVersion() returns (uint version) {
      return version;
    }

    function changeUser(address _user) onlyRecovery {
      user = _user;
    }

    function forward(address destination, uint value, bytes data) onlyUser {
      if (!proxy.call(bytes4(keccak256("forward(address, uint, bytes)")), destination, value, data)) {
          throw;
      }
    }
}
