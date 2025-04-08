import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEvent } from "../utils/contractServices";

// Displays event details and lets the user join the waiting room queue
const EventDetailsPage = ({ account }) => {
    const { eventAddress } = useParams(); // Get the event address from the URL
    const [eventDetails, setEventDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Fetches event metadata (name, organiser, commission rate) from blockchain
    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const details = await getEvent(eventAddress);
                setEventDetails(details);
            } catch (error) {
                console.error("Error fetching event details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [eventAddress]);

    // Called when user clicks "Join Waiting Room"
    // We use /queue/demo-join to insert 3 fake users + real user
    const handleJoinQueue = async () => {
        try {
            const res = await fetch("http://localhost:3000/queue/demo-join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet: account, eventAddress }),
            });

            // Navigate to WaitingRoom page only if join was successful
            if (res.ok) {
                navigate(`/waiting-room/${eventAddress}`);
            } else {
                alert("Failed to join demo queue.");
            }
        } catch (error) {
            console.error("Error joining demo queue:", error);
            alert("Something went wrong while joining the queue.");
        }
    };

    if (loading) return <div>Loading event details...</div>;
    if (!eventDetails) return <div>Event not found.</div>;

    return (
        <div className="eventDetailsPage">
            <h2>{eventDetails.eventName}</h2>
            <p>Organiser: {eventDetails.organiser}</p>

            {/* Button to join the queue */}
            <button onClick={handleJoinQueue} style={{ padding: "12px 20px", fontSize: "16px" }}>
                Join Waiting Room
            </button>
        </div>
    );
};

export default EventDetailsPage;