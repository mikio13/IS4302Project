// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Use pure ERC721 since we no longer need on-chain URI storage.
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./UserRegistry.sol";

contract Ticket is ERC721 {
    uint256 public constant COMMISSION_DENOMINATOR = 10000; // Basis points

    // Structure to store purchase and transfer data for each ticket.
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

    // Events for logging ticket purchases and transfers.
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

    // Users buy tickets via the Event contract.
    function buyTicket(address buyer) external payable {
        require(totalSold < maxSupply, "Sold out");

        // Calculate the total price including commission.
        uint256 totalPrice = basePrice +
            (basePrice * commissionRate) /
            COMMISSION_DENOMINATOR;
        require(msg.value >= totalPrice, "Insufficient funds");

        totalMinted++;
        totalSold++;
        uint256 ticketId = totalMinted;

        // Mint the NFT to the buyer.
        _mint(buyer, ticketId);

        ticketData[ticketId] = TicketData({
            originalOwner: buyer,
            purchasePrice: totalPrice,
            lastTransfer: block.timestamp
        });

        // Refund any excess ETH.
        if (msg.value > totalPrice) {
            payable(buyer).transfer(msg.value - totalPrice);
        }

        emit TicketPurchased(ticketId, buyer, totalPrice);
    }

    // Standard safeTransfer with an update of the last transfer timestamp.
    function safeTransferFromWith(
        address from,
        address to,
        uint256 ticketId
    ) external {
        require(ownerOf(ticketId) == from, "Not the ticket owner");

        // Update the last transfer timestamp.
        ticketData[ticketId].lastTransfer = block.timestamp;

        // Perform a standard safe transfer.
        _safeTransfer(from, to, ticketId, "");
        emit TicketResold(
            ticketId,
            from,
            to,
            ticketData[ticketId].purchasePrice
        );
    }

    // Note: Functions that update tokenURI (safeTransferFromWithURI and updateTicketURI)
    // have been removed because off-chain systems will handle QR code generation and metadata.

    // Returns the purchase price (base price plus commission) of a ticket.
    function getBasePrice(uint256 ticketId) public view returns (uint256) {
        require(
            ticketId > 0 && ticketId <= totalMinted,
            "Ticket does not exist"
        );
        return ticketData[ticketId].purchasePrice;
    }

    // Returns the original owner (as recorded at minting) of a ticket.
    function getTicketOwner(uint256 ticketId) public view returns (address) {
        require(
            ticketId > 0 && ticketId <= totalMinted,
            "Ticket does not exist"
        );
        return ticketData[ticketId].originalOwner;
    }
}
