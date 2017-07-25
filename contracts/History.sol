pragma solidity ^0.4.11;

contract History {
  struct HistoryItem {
    address author;
    string hash;
  }

  HistoryItem[] private histories;

  address owner;

  function strConcat(string _a, string _b, string _c, string _d, string _e) internal returns (string){
    bytes memory _ba = bytes(_a);
    bytes memory _bb = bytes(_b);
    bytes memory _bc = bytes(_c);
    bytes memory _bd = bytes(_d);
    bytes memory _be = bytes(_e);
    string memory abcde = new string(_ba.length + _bb.length + _bc.length + _bd.length + _be.length);
    bytes memory babcde = bytes(abcde);
    uint k = 0;
    for (uint i = 0; i < _ba.length; i++) babcde[k++] = _ba[i];
    for (i = 0; i < _bb.length; i++) babcde[k++] = _bb[i];
    for (i = 0; i < _bc.length; i++) babcde[k++] = _bc[i];
    for (i = 0; i < _bd.length; i++) babcde[k++] = _bd[i];
    for (i = 0; i < _be.length; i++) babcde[k++] = _be[i];
    return string(babcde);
  }

  function strConcat(string _a, string _b, string _c, string _d) internal returns (string) {
    return strConcat(_a, _b, _c, _d, "");
  }

  function strConcat(string _a, string _b, string _c) internal returns (string) {
    return strConcat(_a, _b, _c, "", "");
  }

  function strConcat(string _a, string _b) internal returns (string) {
    return strConcat(_a, _b, "", "", "");
  }


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

  function update(string dataHash) {
    histories.push(HistoryItem(msg.sender, dataHash));
  }

  function get(uint index) constant returns (string) {
    if (index > histories.length-1) {
      throw;
    }

    HistoryItem history = histories[index];
    // if (isOwner() || msg.sender == history.author) {
      return history.hash;
    // }
  }

  function getLength() constant returns (uint) {
    return histories.length;
  }

  function getAll() constant returns (string) {
    if (0 == histories.length) {
      throw;
    }

    string memory ret;
    for (uint i = 0; i < histories.length; i++) {
      ret = strConcat(ret, ";", histories[i].hash);
    }

    return ret;
  }
}
