pragma solidity ^0.4.11;


contract Proxy {
  event Forwarded (address indexed destination,uint value,bytes data);

  address owner;

  modifier onlyOwner() {
    if (isOwner())
      _;
  }

  function isOwner() returns (bool) {
    return (owner == msg.sender);
  }

  function transfer(address _owner) onlyOwner {
    owner = _owner;
  }

  function Proxy(address controllerAddr) {
    owner = controllerAddr;
  }

  function forward(address destination, uint value, bytes data) onlyOwner {
    if (!destination.call.value(value)(data)) {throw;}
    Forwarded(destination, value, data);
  }
}
