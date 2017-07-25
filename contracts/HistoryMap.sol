pragma solidity ^0.4.11;

contract HistoryMap {
    mapping(bytes32 => address) histories;

    function update(string email, address history) {
      histories[keccak256(email)] = history;
    }

    function get(string email) constant returns (address) {
      return histories[keccak256(email)];
    }
}
