import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./WaitingRoom.css";
import { buyTicket, getTicketsForEvent, getTicketPrice } from "../utils/contractServices";
import { formatEther } from "ethers";

const WaitingRoom = ({ account }) => {
    const { eventAddress } = useParams();
    const [queueList, setQueueList] = useState([]);
    const [position, setPosition] = useState(null);
    const [userReady, setUserReady] = useState(false);
    const [buying, setBuying] = useState(false);
    const [ticketCategories, setTicketCategories] = useState([]);
    const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

    useEffect(() => {
        const fetchQueue = async () => {
            try {
                const res = await fetch(`http://localhost:3000/queue?eventAddress=${eventAddress}`);
                const queue = await res.json();
                setQueueList(queue);

                const index = queue.findIndex(entry => entry.wallet === account);
                setPosition(index + 1);

                if (queue[index]?.status === "ready") {
                    setUserReady(true);
                }
            } catch (error) {
                console.error("Error fetching queue:", error);
            }
        };

        const fetchTicketsWithPrices = async () => {
            try {
                const categories = await getTicketsForEvent(eventAddress);
                const withPrices = await Promise.all(
                    categories.map(async (ticket) => {
                        const priceInWei = await getTicketPrice(ticket.ticketAddress);
                        return {
                            ...ticket,
                            price: formatEther(priceInWei), // convert to ETH string
                            priceInWei
                        };
                    })
                );
                setTicketCategories(withPrices);
            } catch (error) {
                console.error("Failed to load ticket categories:", error);
            }
        };

        fetchQueue();
        fetchTicketsWithPrices();

        const interval = setInterval(fetchQueue, 3000);
        return () => clearInterval(interval);
    }, [eventAddress, account]);

    const advanceQueue = async () => {
        await fetch("http://localhost:3000/queue/demo-advance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventAddress }),
        });
    };

    const handleBuyTicket = async () => {
        try {
            setBuying(true);
            const selectedTicket = ticketCategories[selectedCategoryIndex];
            const ethPrice = selectedTicket.price; // string in ETH

            await buyTicket(eventAddress, selectedCategoryIndex, ethPrice);

            await fetch("http://localhost:3000/queue/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet: account, eventAddress }),
            });

            alert("Ticket purchased successfully!");
        } catch (error) {
            console.error("Error buying ticket:", error);
            alert("Purchase failed.");
        } finally {
            setBuying(false);
        }
    };

    return (
        <div className="waiting-room-page">
            <div className="masthead">
                <div className="masthead-bg" />
                <div className="masthead-content">
                    <img className="event-poster" src="/eventImage.jpg" alt="Event Poster" />
                    <div className="masthead-text left-aligned">
                        <p>
                            <span>03 May 2025 (Sat.) | 04 May 2025 (Sun.)</span>
                            <span className="sep"> / </span>
                            <span>Singapore Indoor Stadium</span>
                        </p>
                        <h1>TAEYEON CONCERT - The TENSE in SINGAPORE</h1>
                    </div>
                </div>
            </div>

            <div className="content-container">
                <div style={{ marginBottom: "1rem" }}>
                    <button onClick={advanceQueue}>Advance Queue</button>
                </div>

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

                <h3 className="queue-tips-heading">Queue Tips</h3>
                <div className="queue-tips-container">
                    <div className="queue-tips">
                        <div className="tip">
                            <img src="/stay-signed-in.svg" alt="Stay Signed In" className="tip-icon" />
                            <div>
                                <h4>Stay Signed In</h4>
                                <p>Remain signed in to your account for the entire sale.</p>
                            </div>
                        </div>
                        <div className="tip">
                            <img src="/browser-open.svg" alt="Keep Browser Open" className="tip-icon" />
                            <div>
                                <h4>Keep Browser Open</h4>
                                <p>Don’t close or refresh this page until it's your turn.</p>
                            </div>
                        </div>
                        <div className="tip">
                            <img src="/verified-account.svg" alt="Verified Account" className="tip-icon" />
                            <div>
                                <h4>Use Verified Accounts</h4>
                                <p>Only verified wallets can complete the purchase.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaitingRoom;