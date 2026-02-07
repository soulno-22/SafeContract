export interface ExampleContract {
  id: string;
  name: string;
  description: string;
  code: string;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export const exampleContracts: ExampleContract[] = [
  {
    id: "reentrancy-vault",
    name: "Reentrancy-prone Vault",
    description:
      "A vulnerable vault contract with reentrancy issues and missing access controls.",
    riskLevel: "high",
    code: `pragma solidity ^0.8.0;

contract VulnerableVault {
    mapping(address => uint256) public balances;
    
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }
    
    function withdraw() public {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");
        
        // Vulnerable: External call before state update
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        // State update happens after external call - reentrancy risk!
        balances[msg.sender] = 0;
    }
    
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}`,
  },
  {
    id: "centralized-admin",
    name: "Centralized Admin Token",
    description:
      "A token contract with centralized admin control and potential integer overflow risks.",
    riskLevel: "medium",
    code: `pragma solidity ^0.7.6;

contract CentralizedToken {
    mapping(address => uint256) public balances;
    address public admin;
    uint256 public totalSupply;
    
    constructor() {
        admin = msg.sender;
        totalSupply = 1000000 * 10**18;
        balances[admin] = totalSupply;
    }
    
    function transfer(address to, uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // Potential overflow in older Solidity versions
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
    
    function mint(address to, uint256 amount) public {
        // Missing access control - anyone can mint!
        balances[to] += amount;
        totalSupply += amount;
    }
    
    function setAdmin(address newAdmin) public {
        // No access control check
        admin = newAdmin;
    }
}`,
  },
  {
    id: "unchecked-calls",
    name: "Unchecked External Calls",
    description:
      "Contract with unchecked external calls and missing return value validation.",
    riskLevel: "high",
    code: `pragma solidity ^0.8.0;

contract UncheckedCalls {
    mapping(address => bool) public authorized;
    uint256 public funds;
    
    function addAuthorized(address addr) public {
        authorized[addr] = true;
    }
    
    function sendFunds(address recipient, uint256 amount) public {
        require(authorized[msg.sender], "Not authorized");
        require(funds >= amount, "Insufficient funds");
        
        funds -= amount;
        
        // Vulnerable: Unchecked external call return value
        recipient.call{value: amount}("");
        
        // Execution continues even if call fails
    }
    
    function batchTransfer(address[] memory recipients, uint256[] memory amounts) public {
        require(recipients.length == amounts.length, "Arrays mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            // No return value check
            recipients[i].call{value: amounts[i]}("");
        }
    }
    
    receive() external payable {
        funds += msg.value;
    }
}`,
  },
];

