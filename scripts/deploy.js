const hre = require("hardhat");

async function main() {
    //Deploy the User contract
    const User = await hre.ethers.getContractFactory("User");
    const user = await User.deploy();
    await user.waitForDeployment();
    console.log("User deployed to:", await user.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });