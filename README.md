# IS4302 Group 5:  Authentix

## Steps to run Solidity tests:

1. `npm install` (Installs the node_modules folder (dependencies) for the Solidity + Hardhat environment.)

2. `npx hardhat node` (Launches a local Ethereum blockchain powered by Hardhat on `http://127.0.0.1:8545`.)

3. `npx hardhat compile` (Compiles all the Solidity smart contracts in the `contracts/` folder.)

4. `npx hardhat run scripts/deploy.js --network localhost` (Deploys the contracts to the local Hardhat blockchain, we need to run this for the frontend demo to work)

5. `npx hardhat test` (Runs all the test files inside `IS4302Project/test/`.)

6. All of the sections after this are just for the frontend demo, which is focused on showcasing the QR code feature. You can still use all of the key features just from the Solidity smart contracts.

## 🦊 Steps to Set Up MetaMask for the Frontend Demo

1. **Open MetaMask** in your browser extension.

2. **Add Hardat as a Custom Network**  
   Click on the top left Ethereum icon → **Add a custom network**

   <img src="./readmeAssets/metamask_add_network.png" alt="Add Network Screenshot" width="200"/>

3. **Fill in the following fields:**

   | Field             | Value                          |
   |------------------|--------------------------------|
   | Network Name      | Hardhat             |
   | RPC URL       | http://127.0.0.1:8545    or localhost:8545      |
   | Chain ID          | `31337`         |
   | Currency Symbol   | HardHatETH                            |
   | Block Explorer URL| *Leave blank*                  |

   <img src="./readmeAssets/metamask_fill_fields.png" alt="Fill Fields Screenshot" width="350"/>
 
4. **Click "Save"**  
   You should now see “Hardhat” as an option in your MetaMask networks.

5. **Import a Test Account**  
   Go to MetaMask → Add account or hardware wallet → Import account -> Paste in the private key from the 3rd account shown in the Hardhat node logs (from when u ran npx hardhat node)

   <img src="./readmeAssets/metamask_import_account.png" alt="Import Account Screenshot" width="350"/>

## Steps to run React + Vite frontend: 

1. Complete steps **1–4** from the Solidity section above.

2. `cd frontend`

3. `npm install` (Installs all frontend dependencies.)

4. `npm run dev` (Starts the React + Vite frontend)

5. `http://localhost:5173/` (Open your browser and navigate to this url.)


## Steps to run Express.js backend: (KIV this, haven't decided whether we really need this)

1. `cd backend`

2. `npm install` (to ensure that you have the updated node_nodules)

3. make sure you have mongodb running

4. `npm run server`