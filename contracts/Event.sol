// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EventContract {
    struct TicketType {
        string category; // E.g., "VIP", "General Admission"
        uint256 price; // Price in Eth
        uint256 quota; // Maximum number of tickets for this type
        uint256 sold; // Number of tickets sold for this type
    }

    struct Event {
        uint256 id; // Unique event ID
        address organizer; // Address of the event organizer
        string description; // Event details (name, venue, etc.)
        TicketType[] ticketTypes; // Array of ticket types
    }

    // Event ID counter
    uint256 public nextEventId;
    // Mapping of event ID to Event struct
    mapping(uint256 => Event) public events;

    // Events for off-chain logging and UI updates
    event EventCreated(
        uint256 indexed eventId,
        address indexed organizer,
        string description
    );
    event TicketTypeAdded(
        uint256 indexed eventId,
        uint256 ticketTypeId,
        string category,
        uint256 price,
        uint256 quota
    );

    /**
     * @dev Creates a new event.
     * The caller becomes the organizer of the event.
     * @param _description The event description.
     */
    function createEvent(string calldata _description) external {
        uint256 eventId = nextEventId;
        // Create a new event and store it in the mapping
        Event storage newEvent = events[eventId];
        newEvent.id = eventId;
        newEvent.organizer = msg.sender;
        newEvent.description = _description;
        nextEventId++;

        emit EventCreated(eventId, msg.sender, _description);
    }

    /**
     * @dev Adds a ticket type to an existing event.
     * Only the event organizer can add ticket types.
     * @param eventId The ID of the event.
     * @param _category The category of the ticket type (e.g., "VIP").
     * @param _price The price of the ticket in wei.
     * @param _quota The maximum number of tickets for this type.
     */
    function addTicketType(
        uint256 eventId,
        string calldata _category,
        uint256 _price,
        uint256 _quota
    ) external {
        // Only the organizer can add ticket types
        require(events[eventId].organizer == msg.sender, "Not event organizer");

        // Create and add the new ticket type to the event
        TicketType memory tt = TicketType({
            category: _category,
            price: _price,
            quota: _quota,
            sold: 0
        });
        events[eventId].ticketTypes.push(tt);
        uint256 ticketTypeId = events[eventId].ticketTypes.length - 1;

        emit TicketTypeAdded(eventId, ticketTypeId, _category, _price, _quota);
    }

    /**
     * @dev Retrieves a specific ticket type for a given event.
     * @param eventId The ID of the event.
     * @param ticketTypeId The index of the ticket type.
     * @return The TicketType struct.
     */
    function getTicketType(
        uint256 eventId,
        uint256 ticketTypeId
    ) external view returns (TicketType memory) {
        return events[eventId].ticketTypes[ticketTypeId];
    }
}
