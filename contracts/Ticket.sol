// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "./UserRegistry.sol";

contract Ticket is ERC721URIStorage {
    uint256 public constant COMMISSION_DENOMINATOR = 10000; // Basis points

    struct TicketData {
        address originalOwner;
        uint256 purchasePrice;
        uint256 lastTransfer;
    }

    UserRegistry public immutable userRegistry;
    address public immutable organiser; // The event organiser's address
    uint256 public immutable basePrice;
    uint256 public immutable maxSupply;
    uint256 public commissionRate;

    uint256 public totalMinted;
    uint256 public totalSold;
    mapping(uint256 => TicketData) public ticketData;

    event TicketPurchased(
        uint256 indexed ticketId,
        address buyer,
        uint256 price
    );
    event TicketResold(
        uint256 indexed ticketId,
        address from,
        address to,
        uint256 price
    );
    event TicketURIUpdated(uint256 indexed ticketId, string newURI);

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _maxSupply,
        uint256 _basePrice,
        uint256 _commissionRate,
        address _userRegistry,
        address _organiser
    ) ERC721(_name, _symbol) {
        maxSupply = _maxSupply;
        basePrice = _basePrice;
        commissionRate = _commissionRate;
        userRegistry = UserRegistry(_userRegistry);
        organiser = _organiser;
    }

    //Users should buy via Event.sol
    function buyTicket(address buyer) external payable {
        require(totalSold < maxSupply, "Sold out");

        // Calculate total price
        uint256 totalPrice = basePrice +
            (basePrice * commissionRate) /
            COMMISSION_DENOMINATOR;
        require(msg.value >= totalPrice, "Insufficient funds");

        totalMinted++;
        totalSold++;
        uint256 ticketId = totalMinted;

        // Mint to the buyer
        _mint(buyer, ticketId);

        ticketData[ticketId] = TicketData({
            originalOwner: buyer,
            purchasePrice: totalPrice,
            lastTransfer: block.timestamp
        });

        // Refund excess if any
        if (msg.value > totalPrice) {
            payable(buyer).transfer(msg.value - totalPrice);
        }

        emit TicketPurchased(ticketId, buyer, totalPrice);
    }

    // Custom function to safely transfer a ticket with an updated URI, only the event organiser can update the URI.
    function safeTransferFromWithURI(
        address from,
        address to,
        uint256 ticketId,
        string calldata newMetadataURI
    ) external {
        require(msg.sender == organiser, "Only event organiser can update URI");
        require(ownerOf(ticketId) == from, "Not the ticket owner");

        // Update metadata
        _setTokenURI(ticketId, newMetadataURI);

        // Update last transfer time
        ticketData[ticketId].lastTransfer = block.timestamp;

        // Perform standard ERC721 safeTransfer
        _safeTransfer(from, to, ticketId, "");
        emit TicketResold(
            ticketId,
            from,
            to,
            ticketData[ticketId].purchasePrice
        );
    }

    function updateTicketURI(
        uint256 ticketId,
        string calldata newURI
    ) external {
        // If token does not exist, ownerOf(tokenId) reverts,
        // so we do a try/catch or simply rely on revert:
        require(msg.sender == organiser, "Only event organiser can update URI");

        // If token does not exist, this call reverts with "ERC721: owner query for nonexistent token"
        // address currentOwner = ownerOf(ticketId);
        // We don't actually need currentOwner if we just wanted to ensure it exists.

        _setTokenURI(ticketId, newURI);
        emit TicketURIUpdated(ticketId, newURI);
    }
}
