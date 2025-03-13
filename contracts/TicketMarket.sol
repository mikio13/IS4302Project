// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./UserRegistry.sol";
import "./Ticket.sol";

contract TicketMarket {
    struct Listing {
        address seller;
        address ticketContract;
        uint256 ticketId;
        uint256 price;
        bool active;
    }

    UserRegistry public immutable userRegistry;
    uint256 public commissionRate; // e.g. 500 = 5%
    Listing[] public listings;

    event TicketListed(
        address indexed seller,
        address ticketContract,
        uint256 ticketId,
        uint256 price
    );
    event TicketSold(
        address indexed buyer,
        address ticketContract,
        uint256 ticketId,
        uint256 price
    );

    // The constructor sets the global UserRegistry and commission rate
    constructor(address _userRegistry, uint256 _commissionRate) {
        userRegistry = UserRegistry(_userRegistry);
        commissionRate = _commissionRate;
    }

    function listTicket(
        address ticketContract,
        uint256 ticketId,
        uint256 price
    ) external {
        require(userRegistry.isRegistered(msg.sender), "Unregistered user");

        // Transfer the NFT to the market contract or use an approval-based approach
        IERC721(ticketContract).transferFrom(
            msg.sender,
            address(this),
            ticketId
        );

        listings.push(
            Listing({
                seller: msg.sender,
                ticketContract: ticketContract,
                ticketId: ticketId,
                price: price,
                active: true
            })
        );

        emit TicketListed(msg.sender, ticketContract, ticketId, price);
    }

    function buyTicket(
        uint256 listingId,
        string calldata newMetadataURI
    ) external payable {
        require(listingId < listings.length, "Invalid listingId");
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing inactive");

        // Commission-based total
        uint256 totalPrice = listing.price +
            (listing.price * commissionRate) /
            10000;
        require(msg.value >= totalPrice, "Insufficient funds");

        listing.active = false;

        // Pay seller
        payable(listing.seller).transfer(listing.price);

        // Refund excess
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

        // Transfer NFT to buyer
        IERC721(listing.ticketContract).transferFrom(
            address(this),
            msg.sender,
            listing.ticketId
        );

        // If you want to also update the NFT's metadata, cast to Ticket
        Ticket(listing.ticketContract).safeTransferFromWithURI(
            address(this),
            msg.sender,
            listing.ticketId,
            newMetadataURI
        );

        emit TicketSold(
            msg.sender,
            listing.ticketContract,
            listing.ticketId,
            totalPrice
        );
    }

    function getNumberOfListings() external view returns (uint256) {
        return listings.length;
    }
}
