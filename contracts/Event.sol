// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UserRegistry.sol";
import "./Ticket.sol";

contract Event {
    address public immutable organiser; // Approved organiser
    address public immutable platformOwner; // Platform owner to receive commission
    UserRegistry public immutable userRegistry; // Shared user registry
    uint256 public commissionRate; // Platform commission rate
    string public eventName;

    Ticket[] public ticketCategories;

    event TicketCategoryCreated(address ticketContract, string categoryName);

    constructor(
        address _organiser,
        address _userRegistry,
        address _platformOwner,
        uint256 _commissionRate,
        string memory _eventName
    ) {
        organiser = _organiser;
        userRegistry = UserRegistry(_userRegistry);
        platformOwner = _platformOwner;
        commissionRate = _commissionRate;
        eventName = _eventName;
    }

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
            organiser,
            platformOwner
        );

        ticketCategories.push(newCategory);
        emit TicketCategoryCreated(address(newCategory), name);
    }

    function buyTicket(uint256 categoryIndex) external payable {
        require(userRegistry.isRegistered(msg.sender), "Unregistered user");
        require(categoryIndex < ticketCategories.length, "Invalid category");

        Ticket category = ticketCategories[categoryIndex];
        category.buyTicket{value: msg.value}(msg.sender);
    }

    function getTicketCategories() external view returns (address[] memory) {
        address[] memory addresses = new address[](ticketCategories.length);
        for (uint256 i = 0; i < ticketCategories.length; i++) {
            addresses[i] = address(ticketCategories[i]);
        }
        return addresses;
    }
}
