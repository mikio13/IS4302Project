import React, { useState, useEffect } from "react";
import { getEvents } from "../utils/contractServices";
import { useNavigate } from "react-router-dom";

// Displays a list of all events on the platform + Search Bar to allow users to search for specific events
const EventsPage = ({ account }) => {
    const [events, setEvents] = useState([]); // Raw list of all events from blockchain
    const [filteredEvents, setFilteredEvents] = useState([]); // Events to display after search filtering
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    // Fetch events from blockchain on initial page load
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const eventsList = await getEvents();
                setEvents(eventsList);
                setFilteredEvents(eventsList); // The filtered list will be initialised with the entire list at first
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    // When search term or original events list changes, update filtered list
    useEffect(() => {
        const term = searchTerm.toLowerCase();

        const filtered = events.filter((event) => {
            return (
                event.eventName.toLowerCase().includes(term) ||
                event.organiser.toLowerCase().includes(term)
            );
        });

        setFilteredEvents(filtered);
    }, [searchTerm, events]);

    // Updates search input state as user types
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Show loading screen while fetching events
    if (loading) {
        return <div>Loading events...</div>;
    }

    return (
        <div className="eventsPage">
            <h2>Available Events</h2>

            {/* Search bar */}
            <input
                type="text"
                placeholder="Search by event name or organiser"
                value={searchTerm}
                onChange={handleSearchChange}
                style={{ padding: "8px", marginBottom: "16px", width: "100%" }}
            />

            {/* Filtered list of events */}
            {filteredEvents.length === 0 ? (
                <div>No matching events found.</div>
            ) : (
                <ul>
                    {filteredEvents.map((event) => (
                        <li key={event.eventAddress}>
                            <h3>{event.eventName}</h3>
                            <p>Organiser: {event.organiser}</p>
                            {/* Clicking on this button will navigate to the event detail page */}
                            <button onClick={() => navigate(`/event/${event.eventAddress}`)}>
                                View Details
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default EventsPage;