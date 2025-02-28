// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import OpenZeppelin's ERC721 implementation
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// Define an interface for the Event contract
interface IEvent {
    // Returns the ticket type details as a tuple:
    // (category, price, quota, sold)
    function getTicketType(
        uint256 eventId,
        uint256 ticketTypeId
    ) external view returns (string memory, uint256, uint256, uint256);

    // This function will update the sold count for a given ticket type.
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
        (
            string memory category,
            uint256 price,
            uint256 quota,
            uint256 sold
        ) = eventContract.getTicketType(eventId, ticketTypeId);

        // Ensure the correct price is sent
        require(msg.value == price, "Incorrect Ether value sent");

        // Ensure that there are tickets remaining for this type
        require(sold < quota, "Ticket quota reached");

        // Call the Event contract to update the sold count for this ticket type
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
