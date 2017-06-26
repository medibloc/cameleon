pragma solidity ^0.4.11;

contract AccMap {
    mapping(bytes32 => address) accounts;

    function update(string email, address account) {
      accounts[keccak256(email)] = account;
    }

    function get(string email) returns (address) {
      return accounts[keccak256(email)];
    }
}
