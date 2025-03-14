// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./UserRegistry.sol";
import "./Event.sol";

// This contract is where the Owner of the platform itself will do the following
// Approve organisers, only after approving can these organisers be allowed to create Events, create Tickets etc
contract TicketingPlatform is AccessControl {
    //Creates the Organiser Role
    bytes32 public constant ORGANISER_ROLE = keccak256("ORGANISER_ROLE");

    //immutable here just means that the address is immutable, changes occuring in the registry will reflect here too
    UserRegistry public immutable userRegistry;

    // The commission rate is in basis points so 500 = 5 %
    uint256 public commissionRate;

    event OrganiserApproved(address organiser);
    event EventCreated(address indexed organiser, address eventContract);

    constructor(address _userRegistry, uint256 _commissionRate) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        // Basically grants whoever initialised this contract as the default admin,
        // so the Owner of the platform is the default admin
        userRegistry = UserRegistry(_userRegistry);
        commissionRate = _commissionRate;
    }

    // This function is for the Owner of the platform to approve specific addresses as valid organisers
    function approveOrganiser(
        address organiser
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(ORGANISER_ROLE, organiser);
        emit OrganiserApproved(organiser);
    }

    // This function is to allow approved organisers to create events
    function createEvent(
        string calldata eventName
    ) external onlyRole(ORGANISER_ROLE) returns (address) {
        // Deploy the Event contract
        Event newEvent = new Event(
            msg.sender,
            address(userRegistry),
            commissionRate,
            eventName
        );

        emit EventCreated(msg.sender, address(newEvent));
        return address(newEvent);
    }

    // This function is to allow the owner of the platform to update the commission
    function updateCommission(
        uint256 newRate
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        commissionRate = newRate;
    }
}
