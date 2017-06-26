pragma solidity ^0.4.11;

contract Recovery {
    uint version;
    address[] deligates;
    address owner;
    mapping(address => bool[]) private pendings;

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

    function Recovery(address controllerAddr) {
      version = 0;
      owner = controllerAddr;
    }

    function getVersion() returns (uint) {
      return version;
    }

    function recover(address maybeUser) returns (bool) {
      while (pendings[maybeUser].length < deligates.length)
        pendings[maybeUser].push(false);
    }

    function confirm(address maybeUser) {
      uint i = 0;
      while (deligates[i] != msg.sender)
        i++;
      if (i > deligates.length)
        throw;

      pendings[maybeUser][i] = true;

      for (uint j = 0; j < deligates.length; j++)
        if (!pendings[maybeUser][j])
          return;

      owner.call(bytes4(keccak256("changeUser(address)")), maybeUser);
    }
}
