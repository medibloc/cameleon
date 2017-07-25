pragma solidity ^0.4.11;

import "./Proxy.sol";

contract Controller {
  event Forwarded(address indexed destination, uint value, bytes data);
  event Initialized(address indexed user);

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
    Initialized(user);
  }

  function getVersion() returns (uint version) {
    return version;
  }

  function getProxy() constant returns (address) {
    return proxy;
  }

  function getRecovery() constant returns (address) {
    return recovery;
  }

  function getUser() constant returns (address) {
    return user;
  }

  function changeUser(address _user) onlyRecovery {
    user = _user;
  }

  function forward(address destination, uint value, bytes data) onlyUser {
    Proxy p = Proxy(proxy);
    p.forward(destination, value, data);
    Forwarded(destination, value, data);
  }
}
