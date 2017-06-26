pragma solidity ^0.4.11;

contract CtrMap {
    mapping(bytes32 => address) controllers;

    function update(string email, address controller) {
      controllers[keccak256(email)] = controller;
    }

    function get(string email) returns (address) {
      return controllers[keccak256(email)];
    }
}
