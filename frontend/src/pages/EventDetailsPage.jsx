import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getEvent, getTicketsForEvent, buyTicket } from "../utils/contractServices";

const EventDetailsPage = ({ account }) => {
    const { eventAddress } = useParams();
    const [eventDetails, setEventDetails] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [buying, setBuying] = useState(false);

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const details = await getEvent(eventAddress);
                setEventDetails(details);
                const ticketCategories = await getTicketsForEvent(eventAddress);
                setTickets(ticketCategories);
            } catch (error) {
                console.error("Error fetching event details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [eventAddress]);

    const handleBuyTicket = async (categoryIndex) => {
        try {
            setBuying(true);
            // In a real scenario, we would calculate the proper value.
            // Here, we assume 0.1 ETH for demonstration.
            const paymentValue = "0.1";
            await buyTicket(eventAddress, categoryIndex, paymentValue);
            alert("Ticket purchased successfully!");
        } catch (error) {
            console.error("Error buying ticket:", error);
            alert("Error buying ticket. See console for details.");
        } finally {
            setBuying(false);
        }
    };

    if (loading) {
        return <div>Loading event details...</div>;
    }

    if (!eventDetails) {
        return <div>Event not found.</div>;
    }

    return (
        <div>
            <h2>{eventDetails.eventName}</h2>
            <p>Organiser: {eventDetails.organiser}</p>
            <p>Commission Rate: {eventDetails.commissionRate.toString()}</p>
            <h3>Ticket Categories</h3>
            {tickets.length ? (
                <ul>
                    {tickets.map((ticket, index) => (
                        <li key={ticket.ticketAddress}>
                            <p>Category: {ticket.categoryName}</p>
                            <button onClick={() => handleBuyTicket(index)} disabled={buying}>
                                {buying ? "Processing..." : "Buy Ticket"}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No tickets available for this event.</p>
            )}
        </div>
    );
};

export default EventDetailsPage;