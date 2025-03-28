const { ethers } = require("ethers");
const ticketArtifact = require(path.join(__dirname, "..", "..", "artifacts", "contracts", "Ticket.sol", "Ticket.json"));
const TicketABI = ticketArtifact.abi;
const { initDBIfNecessary, insertTicketPurchase, updateTicketTransfer } = require("./lib/database");

// Need to double check this part, cuz I'm following a dApp tutorial
const providerUrl = "http://localhost:8545";
const ticketContractAddress = "0xYourTicketContractAddress";

const provider = new ethers.providers.JsonRpcProvider(providerUrl);
const ticketContract = new ethers.Contract(ticketContractAddress, TicketABI, provider);

async function startEventListeners() {
    await initDBIfNecessary();

    // Listen for TicketPurchased events.
    ticketContract.on("TicketPurchased", async (ticketId, buyer, price, event) => {
        console.log("Ticket Purchased:", ticketId.toString(), buyer, price.toString());
        try {
            await insertTicketPurchase({
                ticketId: ticketId.toString(),
                buyer,
                price: price.toString(),
                blockNumber: event.blockNumber,
                timestamp: new Date(),
            });
        } catch (err) {
            console.error("Error inserting ticket purchase:", err);
        }
    });

    // Listen for TicketResold events.
    ticketContract.on("TicketResold", async (ticketId, from, to, price, event) => {
        console.log("Ticket Resold:", ticketId.toString(), from, to, price.toString());
        try {
            await updateTicketTransfer({
                ticketId: ticketId.toString(),
                from,
                to,
                price: price.toString(),
                blockNumber: event.blockNumber,
                timestamp: new Date(),
            });
        } catch (err) {
            console.error("Error updating ticket transfer:", err);
        }
    });
}

startEventListeners();