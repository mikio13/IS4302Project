import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEvent, getTicketsForEvent, getTicketPrice } from "../utils/contractServices";
import { formatEther } from "ethers";

const EventDetailsPage = ({ account }) => {
    const { eventAddress } = useParams();
    const [eventDetails, setEventDetails] = useState(null);
    const [ticketCategories, setTicketCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEventData = async () => {
            try {
                const details = await getEvent(eventAddress);
                setEventDetails(details);

                const categories = await getTicketsForEvent(eventAddress);
                const withPrices = await Promise.all(
                    categories.map(async (ticket) => {
                        const priceInWei = await getTicketPrice(ticket.ticketAddress);
                        return {
                            ...ticket,
                            price: formatEther(priceInWei),
                        };
                    })
                );
                setTicketCategories(withPrices);
            } catch (error) {
                console.error("Error loading event data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEventData();
    }, [eventAddress]);

    const handleJoinQueue = async () => {
        try {
            const res = await fetch("http://localhost:3000/api/queue/demo-join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet: account, eventAddress }),
            });

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
        <div className="eventDetailsPage" style={{ padding: "2rem" }}>
            <h2>{eventDetails.eventName}</h2>
            <p>Organiser: {eventDetails.organiser}</p>

            {/* Ticket categories and prices as cards */}
            <div style={{ marginTop: "30px" }}>
                <h3>Available Ticket Categories</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "1rem" }}>
                    {ticketCategories.map((ticket, index) => (
                        <div
                            key={ticket.ticketAddress}
                            style={{
                                background: "#1e1e1e",
                                padding: "1.2rem",
                                borderRadius: "12px",
                                minWidth: "200px",
                                boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                                border: "1px solid #333"
                            }}
                        >
                            <h4 style={{ marginBottom: "0.5rem", color: "#fff" }}>{ticket.categoryName}</h4>
                            <p style={{ margin: 0, fontWeight: "bold", color: "#bbb" }}>{ticket.price} ETH</p>
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={handleJoinQueue}
                style={{
                    padding: "12px 20px",
                    fontSize: "16px",
                    marginTop: "30px",
                    backgroundColor: "#7447e1",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer"
                }}
            >
                Join Waiting Room
            </button>
        </div>
    );
};

export default EventDetailsPage;