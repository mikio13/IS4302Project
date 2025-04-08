import React from "react";

const QueueStatusBox = ({ //Handles the queue progress view and ticket purchase functionality.
    userReady,
    queueList,
    position,
    buying,
    ticketCategories,
    selectedCategoryIndex,
    setSelectedCategoryIndex,
    handleBuyTicket
}) => {
    return (
        <div className="waiting-box">
            {userReady ? (
                <>
                    <h2>You’re Up!</h2>
                    <p>Please choose your ticket category and proceed with your purchase.</p>

                    {ticketCategories.length > 0 ? (
                        <div style={{ marginBottom: "1rem" }}>
                            <label htmlFor="ticket-category">Ticket Category:</label>
                            <select
                                id="ticket-category"
                                value={selectedCategoryIndex}
                                onChange={(e) => setSelectedCategoryIndex(parseInt(e.target.value))}
                                style={{ marginLeft: "1rem", padding: "6px" }}
                            >
                                {ticketCategories.map((ticket, index) => (
                                    <option key={ticket.ticketAddress} value={index}>
                                        {ticket.categoryName} – {ticket.price} ETH
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <p>Loading ticket categories...</p>
                    )}

                    <button onClick={handleBuyTicket} disabled={buying}>
                        {buying ? "Processing..." : "Buy Ticket"}
                    </button>
                </>
            ) : position ? (
                <>
                    <h2>Thank You for Joining the Waiting Room</h2>
                    <p>Your screen will automatically refresh when it’s your turn.</p>
                    <p className="people-ahead">
                        Approximately <strong>{position - 1}</strong> People Ahead
                    </p>
                    <div className="progress-bar-container">
                        <div
                            className="progress-bar-fill"
                            style={{
                                width: `${Math.min(100, ((queueList.length - position + 1) / queueList.length) * 100)}%`,
                            }}
                        />
                    </div>
                </>
            ) : (
                <p>Joining queue...</p>
            )}
        </div>
    );
};

export default QueueStatusBox;