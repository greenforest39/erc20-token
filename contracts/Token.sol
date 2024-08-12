//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    bytes32 public immutable DOMAIN_SEPARATOR;

    /// @dev store backup addresses for holders
    mapping(address => address) public backupAddress;

    /// @dev store blacklist status for users
    mapping(address => bool) public blacklisted;

    event BackupAddressRegistered(address indexed user, address indexed backup);

    event EmergencyTransfer(
        address operator,
        address indexed from,
        address indexed to,
        uint256 amount
    );

    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply_
    ) ERC20(name, symbol) {
        _mint(msg.sender, totalSupply_);

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256("Approve Emergency Transfer"),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    /**
     * @notice Register Backup address for emergency
     * @dev only token holders can call this function
     * @param backup backup address
     */
    function registerBackUpAddress(address backup) external {
        require(balanceOf(msg.sender) > 0, "not token holder");
        require(backup != address(0), "backup address not found");
        require(backup != msg.sender, "backup address = msg.sender");
        require(!blacklisted[backup], "backup address is blacklisted");
        require(
            !blacklisted[msg.sender],
            "block call from blacklisted address"
        );

        backupAddress[msg.sender] = backup;
        emit BackupAddressRegistered(msg.sender, backup);
    }

    /**
     * @notice Transfer user's funds using signature in emergency
     * @param from wallet address to move tokens from
     * @param v parameter (27 or 28)
     * @param r parameter
     * @param s parameter
     */
    function emergencyTransfer(
        address from,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        bytes32 approvalHash = keccak256(
            abi.encode(keccak256("EmergencyTransfer(address from)"), from)
        );
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, approvalHash)
        );
        require(ecrecover(digest, v, r, s) == from, "invalid signature");

        uint256 balance = balanceOf(from);
        require(balance > 0, "no balance");
        require(backupAddress[from] != address(0), "backup address not set");

        blacklisted[from] = true;

        _transfer(from, backupAddress[from], balance);

        emit EmergencyTransfer(msg.sender, from, backupAddress[from], balance);
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (blacklisted[to]) {
            _transfer(from, backupAddress[to], amount);
        } else {
            super._transfer(from, to, amount);
        }
    }
}
