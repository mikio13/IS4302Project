// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./UserRegistry.sol";

contract Ticket is ERC721Enumerable {
    uint256 public constant COMMISSION_DENOMINATOR = 10000;

    struct TicketData {
        address originalOwner;
        uint256 purchasePrice;
        uint256 lastTransfer;
    }

    UserRegistry public immutable userRegistry;
    address public immutable organiser;
    address public immutable platformOwner;
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

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _maxSupply,
        uint256 _basePrice,
        uint256 _commissionRate,
        address _userRegistry,
        address _organiser,
        address _platformOwner
    ) ERC721(_name, _symbol) {
        maxSupply = _maxSupply;
        basePrice = _basePrice;
        commissionRate = _commissionRate;
        userRegistry = UserRegistry(_userRegistry);
        organiser = _organiser;
        platformOwner = _platformOwner;
    }

    function buyTicket(address buyer) external payable {
        require(totalSold < maxSupply, "Sold out");

        uint256 commission = (basePrice * commissionRate) /
            COMMISSION_DENOMINATOR;
        uint256 totalPrice = basePrice + commission;

        require(msg.value >= totalPrice, "Insufficient funds");

        totalMinted++;
        totalSold++;
        uint256 ticketId = totalMinted;

        _mint(buyer, ticketId);

        ticketData[ticketId] = TicketData({
            originalOwner: buyer,
            purchasePrice: totalPrice,
            lastTransfer: block.timestamp
        });

        // Payout
        payable(organiser).transfer(basePrice);
        payable(platformOwner).transfer(commission);

        // Refund excess
        if (msg.value > totalPrice) {
            payable(buyer).transfer(msg.value - totalPrice);
        }

        emit TicketPurchased(ticketId, buyer, totalPrice);
    }

    function safeTransferFromWith(
        address from,
        address to,
        uint256 ticketId
    ) external {
        require(ownerOf(ticketId) == from, "Not the ticket owner");
        ticketData[ticketId].lastTransfer = block.timestamp;
        _safeTransfer(from, to, ticketId, "");
        emit TicketResold(
            ticketId,
            from,
            to,
            ticketData[ticketId].purchasePrice
        );
    }

    function getBasePrice(uint256 ticketId) public view returns (uint256) {
        require(
            ticketId > 0 && ticketId <= totalMinted,
            "Ticket does not exist"
        );
        return ticketData[ticketId].purchasePrice;
    }

    function getTicketOwner(uint256 ticketId) public view returns (address) {
        require(
            ticketId > 0 && ticketId <= totalMinted,
            "Ticket does not exist"
        );
        return ticketData[ticketId].originalOwner;
    }

    function getOwnedTicketIds(
        address owner
    ) external view returns (uint256[] memory) {
        uint256 count = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        return tokenIds;
    }

    function getTicketDetails(
        uint256 ticketId
    )
        external
        view
        returns (
            uint256 purchasePrice,
            address originalOwner,
            uint256 lastTransfer,
            string memory categoryName
        )
    {
        require(
            ticketId > 0 && ticketId <= totalMinted,
            "Ticket does not exist"
        );
        TicketData memory data = ticketData[ticketId];
        return (
            data.purchasePrice,
            data.originalOwner,
            data.lastTransfer,
            name()
        );
    }
}
