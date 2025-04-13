// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./UserRegistry.sol";
import "./Ticket.sol";

// This contract manages ticket resales and ticket-for-ticket trades between users.
// It supports listing, buying, and exchanging tickets, while enforcing fair trade and resale rules.
contract TicketMarket {
    struct Listing {
        address seller;
        address ticketContract;
        uint256 ticketId;
        uint256 price;
        bool active;
    }

    struct Offer {
        address offerer;
        uint256 offerTicketId;
        uint256 topupAmount; // Optional ETH top-up for fair trade
    }

    address public immutable owner;
    UserRegistry public immutable userRegistry;
    uint256 public commissionRate; // In basis points (e.g., 500 = 5%)

    Listing[] public listings;
    mapping(uint256 => Offer[]) public offers;
    mapping(uint256 => mapping(address => uint256)) public topupAmounts; // listingId → offerer → ETH sent

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
    event OfferMade(
        address indexed offerer,
        address listedTicketContract,
        address offeredTicketContract,
        uint256 listedTicketId,
        uint256 offerTicketId,
        uint256 topupAmount
    );
    event OfferAccepted(
        address indexed lister,
        address listedTicketContract,
        address offeredTicketContract,
        uint256 listedTicketId,
        uint256 offerTicketId,
        uint256 topupAmount
    );
    event OfferRetracted(
        address indexed offerer,
        uint256 listedTicketId,
        uint256 refundAmount
    );

    constructor(address _userRegistry, uint256 _commissionRate) {
        userRegistry = UserRegistry(_userRegistry);
        commissionRate = _commissionRate;
        owner = msg.sender;
    }

    // List a ticket for resale at a specified price (capped at original price)
    function listTicket(
        address ticketContract,
        uint256 ticketId,
        uint256 price
    ) external {
        require(userRegistry.isRegistered(msg.sender), "Unregistered user");
        require(
            ERC721Enumerable(ticketContract).ownerOf(ticketId) == msg.sender,
            "Not ticket owner"
        );

        Ticket ticket = Ticket(ticketContract);
        uint256 originalPrice = ticket.getBasePrice(ticketId);
        require(price <= originalPrice, "Exceeds original ticket price");

        ERC721Enumerable(ticketContract).transferFrom(
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

    // Remove a listed ticket (by the seller)
    function unlistTicket(uint256 listingId) external {
        require(userRegistry.isRegistered(msg.sender), "Unregistered user");
        require(listingId < listings.length, "Invalid listing ID");

        Listing storage listing = listings[listingId];
        require(msg.sender == listing.seller, "Not ticket seller");
        require(listing.active, "Listing inactive");

        listing.active = false;

        ERC721Enumerable(listing.ticketContract).transferFrom(
            address(this),
            msg.sender,
            listing.ticketId
        );

        emit TicketUnlisted(
            msg.sender,
            listing.ticketContract,
            listing.ticketId,
            listing.price
        );
    }

    // Purchase a listed ticket (ETH must include price + commission)
    function buyTicket(uint256 listingId) external payable {
        require(listingId < listings.length, "Invalid listing ID");

        Listing storage listing = listings[listingId];
        require(
            listing.active,
            "Ticket is not listed for resale on the market"
        );

        uint256 totalPrice = listing.price +
            (listing.price * commissionRate) /
            10000;
        require(msg.value >= totalPrice, "Insufficient ETH");

        listing.active = false;

        payable(listing.seller).transfer(listing.price);

        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }

        ERC721Enumerable(listing.ticketContract).transferFrom(
            address(this),
            msg.sender,
            listing.ticketId
        );

        emit TicketSold(
            msg.sender,
            listing.ticketContract,
            listing.ticketId,
            totalPrice
        );
    }

    // List a ticket for trade (no ETH price, trade only)
    function listTicketForTrade(
        address ticketContract,
        uint256 ticketId
    ) external {
        require(userRegistry.isRegistered(msg.sender), "Unregistered user");
        require(
            ERC721Enumerable(ticketContract).ownerOf(ticketId) == msg.sender,
            "Not ticket owner"
        );

        Ticket ticket = Ticket(ticketContract);
        uint256 basePrice = ticket.getBasePrice(ticketId);

        ERC721Enumerable(ticketContract).transferFrom(
            msg.sender,
            address(this),
            ticketId
        );

        listings.push(
            Listing({
                seller: msg.sender,
                ticketContract: ticketContract,
                ticketId: ticketId,
                price: basePrice,
                active: true
            })
        );

        emit TicketListed(msg.sender, ticketContract, ticketId, basePrice);
    }

    // Check if sender has already made an offer for a specific listing
    function checkOfferExists(uint256 listingId) public view returns (bool) {
        Offer[] memory listingOffers = offers[listingId];
        for (uint i = 0; i < listingOffers.length; i++) {
            if (listingOffers[i].offerer == msg.sender) return true;
        }
        return false;
    }

    // Propose a ticket-for-ticket trade, possibly with a top-up
    function makeOffer(
        address listedTicketContract,
        address offeredTicketContract,
        uint256 listingId,
        uint256 offeredTicketId
    ) external payable {
        require(listingId < listings.length, "Invalid listing ID");
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing inactive");

        Ticket listed = Ticket(listedTicketContract);
        Ticket offered = Ticket(offeredTicketContract);

        uint256 listValue = listed.getBasePrice(listing.ticketId);
        uint256 offerValue = offered.getBasePrice(offeredTicketId);

        uint256 topup = 0;
        if (listValue > offerValue) {
            topup = listValue - offerValue;
            require(msg.value >= topup, "Top-up too low");
            topupAmounts[listingId][msg.sender] = msg.value;
        }

        offers[listingId].push(
            Offer({
                offerer: msg.sender,
                offerTicketId: offeredTicketId,
                topupAmount: topup
            })
        );

        emit OfferMade(
            msg.sender,
            listedTicketContract,
            offeredTicketContract,
            listing.ticketId,
            offeredTicketId,
            topup
        );
    }

    // Cancel an offer and get refund
    function retractOffer(uint256 listingId) external {
        require(checkOfferExists(listingId), "No active offer");

        Offer[] storage offerList = offers[listingId];
        for (uint i = 0; i < offerList.length; i++) {
            if (offerList[i].offerer == msg.sender) {
                offerList[i] = offerList[offerList.length - 1];
                offerList.pop();
                break;
            }
        }

        uint256 refund = topupAmounts[listingId][msg.sender];
        topupAmounts[listingId][msg.sender] = 0;
        if (refund > 0) payable(msg.sender).transfer(refund);

        emit OfferRetracted(msg.sender, listingId, refund);
    }

    // View all offers made for a listing
    function checkOffers(
        uint256 listingId
    ) external view returns (Offer[] memory) {
        require(msg.sender == listings[listingId].seller, "Not listing owner");
        return offers[listingId];
    }

    // Accept a trade offer (ticket-for-ticket, with optional ETH)
    function acceptOffer(
        uint256 listingId,
        address offerer,
        address listedTicketContract,
        address offeredTicketContract
    ) external payable {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing inactive");
        require(listing.seller == msg.sender, "Not listing owner");

        Offer memory selected;
        for (uint i = 0; i < offers[listingId].length; i++) {
            if (offers[listingId][i].offerer == offerer) {
                selected = offers[listingId][i];
                break;
            }
        }

        Ticket listed = Ticket(listedTicketContract);
        Ticket offered = Ticket(offeredTicketContract);

        uint256 listVal = listed.getBasePrice(listing.ticketId);
        uint256 offerVal = offered.getBasePrice(selected.offerTicketId);

        if (listVal > offerVal) {
            payable(msg.sender).transfer(selected.topupAmount);
        } else if (offerVal > listVal) {
            require(msg.value >= selected.topupAmount, "Top-up underpaid");
            payable(offerer).transfer(selected.topupAmount);
        }

        ERC721Enumerable(listedTicketContract).transferFrom(
            address(this),
            offerer,
            listing.ticketId
        );
        ERC721Enumerable(offeredTicketContract).transferFrom(
            offerer,
            msg.sender,
            selected.offerTicketId
        );

        listing.active = false;

        emit OfferAccepted(
            msg.sender,
            listedTicketContract,
            offeredTicketContract,
            listing.ticketId,
            selected.offerTicketId,
            selected.topupAmount
        );
    }

    // View current price for a listing
    function checkPrice(uint256 listingId) external view returns (uint256) {
        require(listingId < listings.length, "Invalid listing ID");
        require(listings[listingId].active, "Inactive listing");
        return listings[listingId].price;
    }

    // View accumulated commission held in contract
    function checkCommission() public view returns (uint256) {
        require(msg.sender == owner, "Not authorised");
        return address(this).balance;
    }

    // Withdraw all ETH held by the contract (owner only)
    function withdraw() public {
        require(msg.sender == owner, "Not authorised");
        payable(msg.sender).transfer(address(this).balance);
    }

    // Get total number of listings (including inactive)
    function getNumberOfListings() external view returns (uint256) {
        return listings.length;
    }
}
