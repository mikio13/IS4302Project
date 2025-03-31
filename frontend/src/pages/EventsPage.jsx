import React, { useState, useEffect } from "react";
import { getEvents } from "../utils/contractServices";
import { useNavigate } from "react-router-dom";

const EventsPage = ({ account }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const eventsList = await getEvents();
                setEvents(eventsList);
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    if (loading) {
        return <div>Loading events...</div>;
    }

    if (!events.length) {
        return <div>No events available.</div>;
    }

    return (
        <div>
            <h2>Available Events</h2>
            <ul>
                {events.map((event) => (
                    <li key={event.eventAddress}>
                        <h3>{event.eventName}</h3>
                        <p>Organiser: {event.organiser}</p>
                        <button onClick={() => navigate(`/event/${event.eventAddress}`)}>
                            View Details
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default EventsPage;