const Event_ABI = [ //For the ABI can directly copy from IS4302PROJECT/artifacts/contracts/Event.sol, but just copy the abi section over to this file
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_organiser",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_userRegistry",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_commissionRate",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "_eventName",
                "type": "string"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "ticketContract",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "categoryName",
                "type": "string"
            }
        ],
        "name": "TicketCategoryCreated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "categoryIndex",
                "type": "uint256"
            }
        ],
        "name": "buyTicket",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "commissionRate",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "symbol",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "totalSupply",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "basePrice",
                "type": "uint256"
            }
        ],
        "name": "createTicketCategory",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "eventName",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "organiser",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "ticketCategories",
        "outputs": [
            {
                "internalType": "contract Ticket",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "userRegistry",
        "outputs": [
            {
                "internalType": "contract UserRegistry",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

export default Event_ABI;  