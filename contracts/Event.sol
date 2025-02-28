// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Event {
    // Struct to hold ticket type details
    struct TicketType {
        string category; // e.g., "VIP", "General Admission"
        uint256 price; // Price in wei
        uint256 quota; // Maximum number of tickets available for this type
        uint256 sold; // Number of tickets sold (initially 0)
    }

    // Struct to hold event details; using "EventObj" to avoid reserved keyword conflicts
    struct EventObj {
        uint256 id; // Unique event ID
        address organiser; // Organiser's Ethereum address
        string description; // Description (name, venue, date, etc.)
        TicketType[] ticketTypes; // Array of ticket types for the event
    }

    // Auto-incrementing event ID counter
    uint256 public nextEventId;
    // Mapping from event ID to EventObj struct
    mapping(uint256 => EventObj) public events;

    // Events for logging actions
    event EventCreated(
        uint256 indexed eventId,
        address indexed organiser,
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
     * @dev Allows an organiser to create an event.
     * The organiser becomes the owner of that event.
     * @param _description The event description.
     */
    function createEvent(string calldata _description) external {
        uint256 eventId = nextEventId;
        // Create a new event and assign it to the caller as the organiser
        EventObj storage newEvent = events[eventId];
        newEvent.id = eventId;
        newEvent.organiser = msg.sender;
        newEvent.description = _description;
        nextEventId++;

        emit EventCreated(eventId, msg.sender, _description);
    }

    /**
     * @dev Allows the event organiser to add a new ticket type to an event.
     * @param eventId The ID of the event.
     * @param _category The category of the ticket type (e.g., "VIP").
     * @param _price The price of the ticket in wei.
     * @param _quota The maximum number of tickets available for this type.
     */
    function addTicketType(
        uint256 eventId,
        string calldata _category,
        uint256 _price,
        uint256 _quota
    ) external {
        // Only the organiser who created the event can add ticket types
        require(
            events[eventId].organiser == msg.sender,
            "Only organiser can add ticket types"
        );

        // Create the new ticket type and push it into the event's ticketTypes array
        TicketType memory newTicketType = TicketType({
            category: _category,
            price: _price,
            quota: _quota,
            sold: 0
        });
        events[eventId].ticketTypes.push(newTicketType);
        uint256 ticketTypeId = events[eventId].ticketTypes.length - 1;

        emit TicketTypeAdded(eventId, ticketTypeId, _category, _price, _quota);
    }

    /**
     * @dev Retrieves a ticket type for a given event.
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

    /**
     * @dev Increments the sold count for a given ticket type.
     * @param eventId The ID of the event.
     * @param ticketTypeId The index of the ticket type.
     */
    function incrementSold(uint256 eventId, uint256 ticketTypeId) external {
        events[eventId].ticketTypes[ticketTypeId].sold++;
    }
}
