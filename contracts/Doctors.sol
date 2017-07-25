pragma solidity ^0.4.11;

contract Doctors {
  event Approved(address indexed account, uint256 time);

  mapping(address => uint256) public lastTimeVerified;

  function approve(address account) {
    lastTimeVerified[account] = now;
    Approved(account, now);
  }

  function isQualified(address account) constant returns (bool) {
    return now - lastTimeVerified[account] < 15552000;
  }
}
