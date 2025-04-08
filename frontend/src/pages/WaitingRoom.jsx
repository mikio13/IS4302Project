import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./WaitingRoom.css";
import { buyTicket, getTicketsForEvent, getTicketPrice } from "../utils/contractServices";
import { formatEther } from "ethers";

import WaitingRoomHeader from "../components/WaitingRoomHeader";
import QueueStatusBox from "../components/QueueStatusBox";
import QueueTips from "../components/QueueTips";

// Main page for users in the queue for ticket purchase.
// Displays current position, ticket categories, and purchase button.
const WaitingRoom = ({ account }) => {
    const { eventAddress } = useParams();
    const [queueList, setQueueList] = useState([]);
    const [position, setPosition] = useState(null);
    const [userReady, setUserReady] = useState(false);
    const [buying, setBuying] = useState(false);
    const [ticketCategories, setTicketCategories] = useState([]);
    const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

    // Load queue and ticket info when the page mounts
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
                            price: formatEther(priceInWei), // Convert BigInt to more readable ETH string
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

    // Advance queue manually during demo
    const advanceQueue = async () => {
        await fetch("http://localhost:3000/queue/demo-advance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventAddress }),
        });
    };

    // Trigger blockchain purchase and remove user from DB queue
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
            <WaitingRoomHeader />

            <div className="content-container">
                <div style={{ marginBottom: "1rem" }}>
                    <button onClick={advanceQueue}>Advance Queue</button>
                </div>

                <QueueStatusBox
                    userReady={userReady}
                    queueList={queueList}
                    position={position}
                    buying={buying}
                    ticketCategories={ticketCategories}
                    selectedCategoryIndex={selectedCategoryIndex}
                    setSelectedCategoryIndex={setSelectedCategoryIndex}
                    handleBuyTicket={handleBuyTicket}
                />

                <QueueTips />
            </div>
        </div>
    );
};

export default WaitingRoom;