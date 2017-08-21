pragma solidity ^0.4.11;

contract History {
  string hash;
  mapping(uint => address[]) readers;

  address owner;

  modifier onlyOwner() {
    if (isOwner())
      _;
  }

  function History(address proxy) {
    owner = proxy;
  }

  function isOwner() returns (bool) {
    return (owner == msg.sender);
  }

  function update(string dataHash) onlyOwner {
    hash = dataHash;
  }

  function get() constant returns (string) {
    return hash;
  }

  function makeReadable(address user, uint index) onlyOwner {
    for (uint i = 0; i < readers[index].length; i++) {
      if (readers[index][i] == user) {
        return;
      }
    }

    readers[index].push(user);
  }

  function isReadable(address user, uint index) constant returns (bool) {
    for (uint i = 0; i < readers[index].length; i++) {
      if (readers[index][i] == user) {
        return true;
      }
    }

    return false;
  }
}
