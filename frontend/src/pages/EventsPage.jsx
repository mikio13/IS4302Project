import React, { useState, useEffect } from "react";
import { getEvents } from "../utils/contractServices";
import { useNavigate } from "react-router-dom";

const EventsPage = ({ account }) => {
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const eventsList = await getEvents();
                setEvents(eventsList);
                setFilteredEvents(eventsList); // initialize with full list
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    // Update filtered list when search term changes
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

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    if (loading) {
        return <div>Loading events...</div>;
    }

    return (
        <div>
            <h2>Available Events</h2>

            <input
                type="text"
                placeholder="Search by event name or organiser"
                value={searchTerm}
                onChange={handleSearchChange}
                style={{ padding: "8px", marginBottom: "16px", width: "100%" }}
            />

            {filteredEvents.length === 0 ? (
                <div>No matching events found.</div>
            ) : (
                <ul>
                    {filteredEvents.map((event) => (
                        <li key={event.eventAddress}>
                            <h3>{event.eventName}</h3>
                            <p>Organiser: {event.organiser}</p>
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