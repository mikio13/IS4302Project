// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./UserRegistry.sol";
import "./Event.sol";

// This contract governs platform-wide operations, such as organiser approval and event creation.
contract TicketingPlatform is AccessControl {
    // Organisers must hold this role before they are allowed to list events.
    bytes32 public constant ORGANISER_ROLE = keccak256("ORGANISER_ROLE");

    // Reference to the user registry (used to verify identities)
    UserRegistry public immutable userRegistry;

    // Commission rate applied to primary and secondary sales (in basis points)
    uint256 public commissionRate;

    // Tracks all events created by a specific organiser
    mapping(address => address[]) private organiserToEvents;

    // Tracks all events created on the platform
    address[] private allEvents;

    // Events
    event OrganiserApproved(address organiser);
    event EventCreated(address indexed organiser, address eventContract);

    // Platform owner (admin) sets user registry and default commission rate
    constructor(address _userRegistry, uint256 _commissionRate) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        userRegistry = UserRegistry(_userRegistry);
        commissionRate = _commissionRate;
    }

    // Called by the platform owner to approve new organisers.
    function approveOrganiser(
        address organiser
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(ORGANISER_ROLE, organiser);
        emit OrganiserApproved(organiser);
    }

    // Organisers use this to create new event contracts.
    function createEvent(
        string calldata eventName
    ) external onlyRole(ORGANISER_ROLE) returns (address) {
        Event newEvent = new Event(
            msg.sender,
            address(userRegistry),
            commissionRate,
            eventName
        );
        organiserToEvents[msg.sender].push(address(newEvent));
        allEvents.push(address(newEvent));

        emit EventCreated(msg.sender, address(newEvent));
        return address(newEvent);
    }

    // Allows the platform owner to update the global commission rate.
    function updateCommission(
        uint256 newRate
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        commissionRate = newRate;
    }

    // Returns all events created by a particular organiser.
    function getEventsByOrganiser(
        address organiser
    ) external view returns (address[] memory) {
        return organiserToEvents[organiser];
    }

    // Returns all events created on the platform.
    function getAllEvents() external view returns (address[] memory) {
        return allEvents;
    }
}
