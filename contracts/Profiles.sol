pragma solidity ^0.4.11;

contract Profiles {
    mapping(address => string) public profiles;

    function update(string hash) {
        profiles[msg.sender] = hash;
    }
}
