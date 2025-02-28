const hre = require("hardhat");

async function main() {
    //Deploy the User contract
    const User = await hre.ethers.getContractFactory("User");
    const user = await User.deploy();
    await user.waitForDeployment();
    console.log("User deployed to:", await user.getAddress());

    //Deploy the User contract
    const Event = await hre.ethers.getContractFactory("Event");
    const event = await Event.deploy();
    await event.waitForDeployment();
    console.log("Event deployed to:", await event.getAddress());


    //Deploy the Ticket contract
    const Ticket = await hre.ethers.getContractFactory("Ticket");
    const ticket = await Ticket.deploy();
    await ticket.waitForDeployment();
    console.log("Ticket deployed to:", await ticket.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });