import React from "react";
import { useLocation } from "react-router-dom";
import { decode as base64urlDecode } from "js-base64";

// This component is used to verify a ticket when the QR code is scanned.
// It decodes the data embedded in the QR and displays the ticket and owner info.
export default function VerifyTicket() {
    // Extract the encoded data from the URL query string
    const query = new URLSearchParams(useLocation().search);
    const encoded = query.get("data");

    // If no data found in the QR URL, show error message
    if (!encoded) {
        return <p>No ticket data found in QR code.</p>;
    }

    let ticket;
    try {
        // Decode base64 payload and parse JSON to retrieve ticket info
        ticket = JSON.parse(base64urlDecode(encoded));
    } catch (e) {
        // Show error if decoding or parsing fails
        return <p>Invalid QR code data. Please try again.</p>;
    }

    // Show ticket details in a nicely formatted box
    return (
        <div className="verify-ticket" style={verifyStyles}>
            <h2>Ticket Verification</h2>
            <p><strong>Event Name:</strong> {ticket.event}</p>
            <p><strong>Ticket Category:</strong> {ticket.category}</p>
            <p><strong>Ticket ID:</strong> {ticket.ticketId}</p>
            <p><strong>Owner Name:</strong> {ticket.name}</p>
            <p><strong>NRIC:</strong> {ticket.nric}</p>
        </div>
    );
}

// Styling for the verification box
const verifyStyles = {
    maxWidth: "500px",
    margin: "50px auto",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
    fontFamily: "Arial, sans-serif",
};