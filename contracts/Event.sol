// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UserRegistry.sol";
import "./Ticket.sol";

// Each Event is a separate contract that issues Ticket categories and handles primary sales
contract Event {
    address public immutable organiser; // Address of the approved organiser who created this Event
    UserRegistry public immutable userRegistry; // Shared registry for verifying user registrations
    uint256 public commissionRate; // Platform commission in basis points (e.g., 500 = 5%)
    string public eventName;

    Ticket[] public ticketCategories; // List of Ticket category contracts created for this event

    event TicketCategoryCreated(address ticketContract, string categoryName);

    constructor(
        address _organiser,
        address _userRegistry,
        uint256 _commissionRate,
        string memory _eventName
    ) {
        organiser = _organiser;
        userRegistry = UserRegistry(_userRegistry);
        commissionRate = _commissionRate;
        eventName = _eventName;
    }

    // Organisers can create ticket categories (e.g., VIP, GA)
    function createTicketCategory(
        string calldata name,
        string calldata symbol,
        uint256 totalSupply,
        uint256 basePrice
    ) external {
        require(msg.sender == organiser, "Unauthorised");

        Ticket newCategory = new Ticket(
            name,
            symbol,
            totalSupply,
            basePrice,
            commissionRate,
            address(userRegistry),
            organiser
        );

        ticketCategories.push(newCategory);
        emit TicketCategoryCreated(address(newCategory), name);
    }

    // Public ticket purchase entry point
    function buyTicket(uint256 categoryIndex) external payable {
        require(userRegistry.isRegistered(msg.sender), "Unregistered user");
        require(categoryIndex < ticketCategories.length, "Invalid category");

        Ticket category = ticketCategories[categoryIndex];
        category.buyTicket{value: msg.value}(msg.sender);
    }

    // Returns addresses of all ticket categories for this event
    function getTicketCategories() external view returns (address[] memory) {
        address[] memory addresses = new address[](ticketCategories.length);
        for (uint256 i = 0; i < ticketCategories.length; i++) {
            addresses[i] = address(ticketCategories[i]);
        }
        return addresses;
    }
}
