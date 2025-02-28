// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// Define an interface for the Event contract, including a TicketType struct
interface IEvent {
    struct TicketType {
        string category; // e.g., "VIP", "General Admission"
        uint256 price; // Price in wei
        uint256 quota; // Maximum number of tickets available for this type
        uint256 sold; // Number of tickets sold (initially 0)
    }
    function getTicketType(
        uint256 eventId,
        uint256 ticketTypeId
    ) external view returns (TicketType memory);
    function incrementSold(uint256 eventId, uint256 ticketTypeId) external;
}

contract Ticket is ERC721 {
    // Struct to store on-chain ticket information
    struct TicketInfo {
        uint256 ticketId; // Unique ticket ID (same as tokenId)
        uint256 eventId; // Event ID this ticket belongs to
        uint256 ticketTypeId; // Ticket type index from the Event contract
        string qrCode; // A dynamic QR code (could be regenerated on transfer)
    }

    uint256 public nextTicketId; // Auto-increment ticket ID
    mapping(uint256 => TicketInfo) public tickets;

    // Reference to the deployed Event contract
    IEvent public eventContract;

    // Temporary debug event to log the expected price and msg.value
    event DebugPrice(uint256 expectedPrice, uint256 sentValue);

    event TicketMinted(
        uint256 indexed ticketId,
        uint256 indexed eventId,
        uint256 indexed ticketTypeId,
        address owner
    );

    constructor(address eventContractAddress) ERC721("EventTicket", "ETKT") {
        eventContract = IEvent(eventContractAddress);
    }

    function buyTicket(
        uint256 eventId,
        uint256 ticketTypeId,
        string calldata qrCode
    ) external payable {
        // Retrieve ticket type details from the Event contract
        IEvent.TicketType memory tt = eventContract.getTicketType(
            eventId,
            ticketTypeId
        );
        uint256 price = tt.price;
        uint256 quota = tt.quota;
        uint256 sold = tt.sold;

        // Emit the debug event to log the expected price and the Ether sent
        emit DebugPrice(price, msg.value);

        // Ensure the correct price is sent
        require(msg.value == price, "Incorrect Ether value sent");

        // Ensure that there are tickets remaining for this type
        require(sold < quota, "Ticket quota reached");

        // Update the sold count in the Event contract
        eventContract.incrementSold(eventId, ticketTypeId);

        // Mint the ERC721 token representing the ticket
        uint256 ticketId = nextTicketId;
        _mint(msg.sender, ticketId);

        // Save ticket info on-chain
        tickets[ticketId] = TicketInfo({
            ticketId: ticketId,
            eventId: eventId,
            ticketTypeId: ticketTypeId,
            qrCode: qrCode
        });

        nextTicketId++;

        emit TicketMinted(ticketId, eventId, ticketTypeId, msg.sender);
    }
}
