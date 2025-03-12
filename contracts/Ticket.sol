// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

//ERC721URIStorage means that it follows the ERC721 standard for NFTs
//and adds built-in functionality for managing token URIs (metadata)

//To clarify, this contract can mint many NFT tokens. Each minted token represents a ticket.
//Buyers don’t get a separate instance of the Ticket contract. They own one or more NFT tokens issued by this contract.
contract Ticket is ERC721URIStorage, ReentrancyGuard {
    address payable public eventOrganiser;
    address public eventOrganiserContract;

    string public eventName;
    uint256 public currentMintedTicketId;
    uint256 public lastSoldTicketId;
    uint256 public totalTicketSupply;
    uint256 public category;
    uint256 public originalTicketPrice;
    uint256 public commissionFee;
    uint256 public totalTicketPrice;
    address public userRegistryAddress; // no longer used in checks here, but left in for reference

    struct TicketInfo {
        address originalTicketMinter;
        address prevOwner;
        uint256 currTicketPrice;
    }

    mapping(uint256 => TicketInfo) public tickets;

    event TicketMinted(uint256 ticketId, address minter);
    event TicketPurchased(uint256 ticketId, address buyer);
    event TicketURIUpdated(uint256 ticketId, string newURI);

    constructor(
        string memory _eventName,
        string memory _eventSymbol,
        uint256 _totalTicketSupply,
        uint256 _category,
        uint256 _originalTicketPrice,
        uint256 _commissionFee,
        address _userRegistryAddress,
        address _eventOrganiserContract
    ) ERC721(_eventName, _eventSymbol) {
        eventOrganiser = payable(msg.sender);
        eventName = _eventName;
        currentMintedTicketId = 0;
        lastSoldTicketId = 0;
        totalTicketSupply = _totalTicketSupply;
        category = _category;
        originalTicketPrice = _originalTicketPrice;
        commissionFee = _commissionFee;
        totalTicketPrice = originalTicketPrice + commissionFee;
        userRegistryAddress = _userRegistryAddress;

        // Set the initial eventOrganiserContract if known
        eventOrganiserContract = _eventOrganiserContract;
    }

    function setEventOrganiserContract(
        address _eventOrganiserContract
    ) external onlyEventOrganiser {
        eventOrganiserContract = _eventOrganiserContract;
    }

    modifier onlyEventOrganiser() {
        require(
            msg.sender == eventOrganiser,
            "Only the event organiser can perform this action"
        );
        _;
    }

    modifier onlyEventOrganiserContractOrOrganiser() {
        require(
            msg.sender == eventOrganiserContract ||
                msg.sender == eventOrganiser,
            "Not authorized"
        );
        _;
    }

    modifier ticketIdExists(uint256 ticketId) {
        require(
            ticketId > 0 && ticketId <= currentMintedTicketId,
            "Ticket does not exist"
        );
        _;
    }

    function getCurrentTicketPrice(
        uint256 ticketId
    ) public view ticketIdExists(ticketId) returns (uint256) {
        return tickets[ticketId].currTicketPrice;
    }

    function checkOriginalMinter(
        uint256 ticketId
    ) public view ticketIdExists(ticketId) returns (address) {
        return tickets[ticketId].originalTicketMinter;
    }

    function getOwnerOf(
        uint256 ticketId
    ) public view ticketIdExists(ticketId) returns (address) {
        return ownerOf(ticketId);
    }

    function getPrevOwner(
        uint256 ticketId
    ) public view ticketIdExists(ticketId) returns (address) {
        return tickets[ticketId].prevOwner;
    }

    function changeCurrentTicketPrice(
        uint256 ticketId,
        uint256 newTicketPrice
    ) public ticketIdExists(ticketId) {
        tickets[ticketId].currTicketPrice = newTicketPrice;
    }

    // Mint a new ticket (only event organiser can mint).
    function mintTicket() public onlyEventOrganiser {
        require(
            currentMintedTicketId < totalTicketSupply,
            "Cannot mint more tickets, supply reached"
        );
        currentMintedTicketId++;

        // Mint to this contract (so it can directly transfer to buyers).
        _mint(address(this), currentMintedTicketId);

        tickets[currentMintedTicketId] = TicketInfo({
            originalTicketMinter: eventOrganiser,
            prevOwner: address(0),
            currTicketPrice: originalTicketPrice
        });

        emit TicketMinted(currentMintedTicketId, eventOrganiser);
    }

    function bulkMintTickets(uint256 _nrOfTickets) public onlyEventOrganiser {
        require(
            currentMintedTicketId + _nrOfTickets <= totalTicketSupply,
            "Minting exceeds supply"
        );
        for (uint256 i = 0; i < _nrOfTickets; i++) {
            mintTicket();
        }
    }

    // User-to-user transfer after initial sale.
    function transferTicket(
        address from,
        address to,
        uint256 ticketId
    ) external {
        require(ownerOf(ticketId) == from, "Not the ticket owner");
        // safeTransferFrom enforces ownership/approval checks.
        safeTransferFrom(from, to, ticketId);
        tickets[ticketId].prevOwner = from;
    }

    //This is the underlying logic for purchasing tickets, the irl buyers aren't supposed to buy directly from here
    //This is for the EventOrganiser contract to call
    function buyTicket(
        address buyer,
        string memory newTokenURI
    ) public payable nonReentrant onlyEventOrganiserContractOrOrganiser {
        require(msg.value >= totalTicketPrice, "Insufficient funds");
        require(
            lastSoldTicketId < currentMintedTicketId,
            "No tickets for sale"
        );

        lastSoldTicketId++;

        // Calculate any refund
        uint256 refund = msg.value - totalTicketPrice;

        // Transfer sale proceeds to the event organiser
        eventOrganiser.transfer(totalTicketPrice);

        // Refund excess
        if (refund > 0) {
            payable(buyer).transfer(refund);
        }

        // Transfer ownership from this contract to buyer
        _transfer(address(this), buyer, lastSoldTicketId);
        tickets[lastSoldTicketId].prevOwner = address(this);

        emit TicketPurchased(lastSoldTicketId, buyer);

        // Set metadata URI
        _setTokenURI(lastSoldTicketId, newTokenURI);
        emit TicketURIUpdated(lastSoldTicketId, newTokenURI);
    }

    // Update token URI (e.g., after a resale).
    function updateTicketURI(
        uint256 ticketId,
        string memory newTokenURI
    ) public ticketIdExists(ticketId) onlyEventOrganiserContractOrOrganiser {
        _setTokenURI(ticketId, newTokenURI);
        emit TicketURIUpdated(ticketId, newTokenURI);
    }
}
