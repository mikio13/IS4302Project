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

    struct Offer {
        address offerer;
        uint256 offerTicketId;
        uint256 topupAmount; // amount that needs to be paid to balance the trade
    }

    address owner = msg.sender;
    UserRegistry public immutable userRegistry;
    uint256 public commissionRate; // e.g. 500 = 5%
    Listing[] public listings;
    mapping(uint256 => Offer[]) offers;
    mapping(uint256 => mapping(address => uint256)) public topupAmounts; // listingId -> offerer -> topupAmount

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
        address ticketContract,
        uint256 listedTicketId,
        uint256 offerTicketId,
        uint256 topupAmount
    );

    event OfferAccepted(
        address indexed lister,
        address ticketContract,
        uint256 listedTicketId,
        uint256 offerTicketId,
        uint256 topupAmount
    );

    event OfferRetracted(
        address indexed offerer,
        uint256 listedTicketId,
        uint256 refundAmount
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
        require(
            msg.sender == IERC721(ticketContract).ownerOf(ticketId),
            "Not the owner of the ticket"
        );
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
        require(msg.sender == listing.seller, "Not the owner of this ticket");
        require(
            listing.active,
            "Ticket is not listed for resale on the market"
        );

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

    function buyTicket(uint256 listingId) external payable {
        require(listingId < listings.length, "Invalid listingId");
        Listing storage listing = listings[listingId];
        require(
            listing.active,
            "Ticket is not listed for resale on the market"
        );

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

    function listTicketforTrade(
        address ticketContract,
        uint256 ticketId
    ) external {
        require(userRegistry.isRegistered(msg.sender), "Unregistered user");
        require(
            msg.sender == IERC721(ticketContract).ownerOf(ticketId),
            "Not the owner of the ticket"
        );

        Ticket ticket = Ticket(ticketContract);
        uint256 originalPrice = ticket.getBasePrice(ticketId);
        

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
                price: originalPrice,
                active: true
            })
        );

        emit TicketListed(msg.sender, ticketContract, ticketId, originalPrice);
    }

    function checkOfferExists(
        uint256 listingId
    ) public view returns (bool exists) {
        uint256 numOffers = offers[listingId].length;
        for (uint i = 0; i < numOffers; i++) {
            if (offers[listingId][i].offerer == msg.sender) {
                exists = true;
                return exists;
            }
        }
    }

    // offer value needs to match listing value > fair trade
    // if the offerer has to pay > ticketMarket needs to hold the eth first > to be released when:
    // 1. lister accepts offer > ticketMarket will pay the eth to the lister
    // 2. offerer retracts offer > ticketMarket returns eth to the offerer
    function makeOffer(
        address ticketContract,
        uint256 listingId,
        uint256 offeredTicketId
    ) external payable {
        require(listingId < listings.length, "Invalid listingId");
        Listing storage listing = listings[listingId];
        require(
            listing.active,
            "Ticket is not listed for resale on the market"
        );
        Ticket ticket = Ticket(ticketContract);
        uint256 listingValue = ticket.getBasePrice(listing.ticketId);
        uint256 offeringValue = ticket.getBasePrice(offeredTicketId);

        uint256 topupAmount = 0;

        // TO CHECK
        // might need to double check for refunding of excess eth here
        if (listingValue >= offeringValue) {
            topupAmount = listingValue - offeringValue;
            require(msg.value >= topupAmount, "Insufficient top-up amount");
            topupAmounts[listingId][msg.sender] = msg.value;
        } else {
            topupAmount = offeringValue - listingValue;
            topupAmounts[listingId][msg.sender] = 0; // No ETH needed
        }

        offers[listingId].push(
            Offer({
                offerer: msg.sender,
                offerTicketId: offeredTicketId,
                topupAmount: topupAmount
            })
        );

        emit OfferMade(
            msg.sender,
            ticketContract,
            listing.ticketId,
            offeredTicketId,
            topupAmount
        );
    }

    // eth will be refunded to the offerer
    function retractOffer(uint256 listingId) external {
        require(
            checkOfferExists(listingId) == true,
            "Offer has not been made for this listing"
        );
        Listing storage listing = listings[listingId];

        uint256 numOffers = offers[listingId].length;
        for (uint i = 0; i < numOffers; i++) {
            if (offers[listingId][i].offerer == msg.sender) {
                offers[listingId][i] = offers[listingId][numOffers - 1];
                offers[listingId].pop();
                break;
            }
        }

        uint256 refundAmount = topupAmounts[listingId][msg.sender];
        topupAmounts[listingId][msg.sender] = 0; // clear the stored eth

        if (refundAmount > 0) {
            payable(msg.sender).transfer(refundAmount);
        }

        emit OfferRetracted(msg.sender, listing.ticketId, refundAmount);
    }

    function checkOffers(
        uint256 listingId
    ) external view returns (Offer[] memory) {
        require(
            msg.sender == listings[listingId].seller,
            "Not the lister of this ticket"
        );
        uint256 numOffers = offers[listingId].length;
        Offer[] memory offerIds = new Offer[](numOffers);

        for (uint i = 0; i < numOffers; i++) {
            Offer storage offer = offers[listingId][i];
            offerIds[i] = offer;
        }
        return offerIds;
    }

    function acceptOffer(
        uint256 listingId,
        address offerer,
        address ticketContract
    ) external payable {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");
        Offer memory selectedOffer;

        uint256 numOffer = offers[listingId].length;
        for (uint i = 0; i < numOffer; i++) {
            if (offers[listingId][i].offerer == offerer) {
                selectedOffer = offers[listingId][i];
                break;
            }
        }
        Ticket ticket = Ticket(ticketContract);

        uint256 topupAmount = selectedOffer.topupAmount;
        uint256 listedTicketValue = ticket.getBasePrice(listing.ticketId);
        uint256 offeredTicketValue = ticket.getBasePrice(selectedOffer.offerTicketId);

        if (listedTicketValue > offeredTicketValue) {
            // Offerer must pay
            payable(listing.seller).transfer(topupAmount);
        } else if (offeredTicketValue > listedTicketValue) {
            // Lister must pay
            require(msg.value >= topupAmount, "Insufficient top-up amount");
            payable(selectedOffer.offerer).transfer(topupAmount);
        } else {
            require(msg.value == 0, "No payment required");
        }

        // Transfer tikcets
        IERC721(ticketContract).transferFrom(
            address(this),
            selectedOffer.offerer,
            listing.ticketId
        );
        IERC721(ticketContract).transferFrom(
            selectedOffer.offerer,
            listing.seller,
            selectedOffer.offerTicketId
        );

        listing.active = false;

        emit OfferAccepted(
            msg.sender,
            ticketContract,
            listing.ticketId,
            selectedOffer.offerTicketId,
            topupAmount
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
