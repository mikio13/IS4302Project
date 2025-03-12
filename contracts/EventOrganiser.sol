// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Ticket.sol";
import "./UserRegistry.sol";

// This contract acts as an aggregator for multiple Ticket contracts (each representing a seat category).
// Think of it as this contract being the main "entry point" where the backend will call and each Ticket contract is the underlying implementation
// The irl event organiser will associate the diff Ticket contracts to this contract
// Buyers call this contract to purchase tickets, which internally calls the respective Ticket contract's buy function.

contract EventOrganiser {
    address public organiser; // The address that deploys this contract
    UserRegistry public userRegistry;
    Ticket[] public tickets; // Array of Ticket contracts (each seat category is one contract)

    constructor(address _userRegistry) {
        organiser = msg.sender;
        userRegistry = UserRegistry(_userRegistry);
    }

    modifier onlyOrganiser() {
        require(msg.sender == organiser, "Only organiser can call this");
        _;
    }

    //We need this function to keep track of which Tickets are associated to this
    function addTicketContract(address _ticketContract) external onlyOrganiser {
        tickets.push(Ticket(_ticketContract));
    }

    //Links this contract as the 'eventOrganiserContract' in a specific Ticket contract,
    //so it can call restricted functions like buyTicket and updateTicketURI.
    //By right u deploy UserRegistry and EventOrganiser first, and pass in this contract's address when u deploy each Ticket so u don't need to call this function at all
    //It's a helper in case u need to reassociate contracts

    function linkAsOrganiserContract(uint256 index) external onlyOrganiser {
        require(index < tickets.length, "Invalid ticket index");
        tickets[index].setEventOrganiserContract(address(this));
    }

    function getTicketPrice(uint256 index) external view returns (uint256) {
        require(index < tickets.length, "Invalid ticket index");
        return tickets[index].totalTicketPrice();
    }

    function getTicketOwner(
        uint256 index,
        uint256 ticketId
    ) external view returns (address) {
        require(index < tickets.length, "Invalid ticket index");
        return tickets[index].getOwnerOf(ticketId);
    }

    function getAllTicketContracts() external view returns (Ticket[] memory) {
        return tickets;
    }

    //All irl buyers must call the buyTicket function from here, and this will call the underlying Ticket contract's buyTicket function
    function buyTicket(
        uint256 index,
        string memory newTokenURI
    ) external payable {
        require(index < tickets.length, "Invalid ticket index");
        // Check if the caller is a registered user
        require(userRegistry.isRegistered(msg.sender), "Caller not registered");

        // Now forward the call to the Ticket contract
        // Passing `msg.sender` as the 'buyer' address
        tickets[index].buyTicket{value: msg.value}(msg.sender, newTokenURI);
    }
}
