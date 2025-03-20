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

    address owner = msg.sender;
    UserRegistry public immutable userRegistry;
    uint256 public commissionRate; // e.g. 500 = 5%
    Listing[] public listings;

    event TicketListed(
        address indexed seller,
        address ticketContract,
        uint256 ticketId,
        uint256 price
    );

    event TicketUnlisted(
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
        Ticket ticket = Ticket(ticketContract);
        uint256 originalPrice = ticket.getBasePrice(ticketId);
        require(price <= originalPrice, "Price exceeds original ticket price");

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

    function unlistTicket(uint256 listingId) external {
        require(userRegistry.isRegistered(msg.sender), "Unregistered user");
        require(listingId < listings.length, "Invalid listingId");
        Listing storage listing = listings[listingId];
        require(msg.sender == listing.seller, "Not the seller of this ticket");
        require(listing.active, "Ticket is not listed for resale on the market");

        listing.active = false;

        IERC721(listing.ticketContract).transferFrom(
            address(this),
            msg.sender,
            listing.ticketId
        );

        emit TicketUnlisted(
            listing.seller,
            listing.ticketContract,
            listing.ticketId,
            listing.price
        );
    }

    function buyTicket(
        uint256 listingId
    ) external payable {
        require(listingId < listings.length, "Invalid listingId");
        Listing storage listing = listings[listingId];
        require(listing.active, "Ticket is not listed for resale on the market");

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

        // Ticket(listing.ticketContract).safeTransferFromWithURI(
        //     address(this),
        //     msg.sender,
        //     listing.ticketId,
        //     newMetadataURI
        // );

        emit TicketSold(
            msg.sender,
            listing.ticketContract,
            listing.ticketId,
            totalPrice
        );
    }   

    function checkPrice(uint256 listingId) external view returns (uint256) {
        require(listingId < listings.length, "Invalid listingId");
        require(listings[listingId].active, "Listing is not active");
        return listings[listingId].price;
    }

    function checkCommission() public view returns (uint256) {
        require(msg.sender == owner, "Sorry, you are not allowed to do that");
        return address(this).balance;
    }

    function withdraw() public {
        require(msg.sender == owner, "Sorry, you are not allowed to do that");
        payable(msg.sender).transfer(address(this).balance);
    }

    // this includes inactive listings as well
    function getNumberOfListings() external view returns (uint256) {
        return listings.length;
    }
}
