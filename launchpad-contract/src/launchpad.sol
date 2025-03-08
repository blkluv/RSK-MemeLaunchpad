// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

// Meme Token Contract
contract MemeToken is ERC20, Ownable, ERC20Burnable {
    uint256 public immutable MAX_SUPPLY;
    
    constructor(
        string memory name, 
        string memory symbol, 
        uint256 initialSupply,
        uint256 maxSupply,
        address creator
    ) ERC20(name, symbol) Ownable(creator) {
        require(maxSupply > 0, "Max supply must be greater than 0");
        require(initialSupply <= maxSupply, "Initial supply exceeds max supply");
        MAX_SUPPLY = maxSupply;
        _mint(creator, initialSupply);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
}

contract MemeTokenLaunchpad is Ownable {
    struct TokenLaunch {
        address tokenAddress;
        address creator;
        string name;
        string symbol;
        uint256 initialSupply;
        uint256 maxSupply;
        uint256 launchPrice;  // Price per token in wei
        uint256 totalRaised;
        uint256 remainingSupply;  // Added to track remaining tokens
        bool isLaunched;
    }

    uint256 public launchFee = 0.00003 ether;
    TokenLaunch[] public tokenLaunches;
    mapping(address => bool) public whitelistedTokens;
    
    // Track purchases per user address
    mapping(address => mapping(uint256 => uint256)) public userPurchases;

    event TokenLaunchCreated(
        address indexed tokenAddress, 
        address indexed creator, 
        string name, 
        string symbol, 
        uint256 initialSupply,
        uint256 maxSupply
    );

    event TokenPurchased(
        address indexed buyer, 
        address indexed tokenAddress, 
        uint256 amount,
        uint256 etherPaid
    );

    constructor() Ownable(msg.sender) {}

    function createTokenLaunch(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 maxSupply,
        uint256 launchPrice
    ) public payable {
        require(msg.value >= launchFee, "Insufficient launch fee");
        require(initialSupply > 0, "Initial supply must be greater than 0");
        require(maxSupply >= initialSupply, "Max supply must be greater than or equal to initial supply");
        require(launchPrice > 0, "Launch price must be greater than 0");
        
        MemeToken newToken = new MemeToken(name, symbol, initialSupply, maxSupply, address(this));
        
        TokenLaunch memory launch = TokenLaunch({
            tokenAddress: address(newToken),
            creator: msg.sender,
            name: name,
            symbol: symbol,
            initialSupply: initialSupply,
            maxSupply: maxSupply,
            launchPrice: launchPrice,
            totalRaised: 0,
            remainingSupply: initialSupply,
            isLaunched: true
        });

        tokenLaunches.push(launch);
        whitelistedTokens[address(newToken)] = true;

        emit TokenLaunchCreated(
            address(newToken), 
            msg.sender, 
            name, 
            symbol, 
            initialSupply,
            maxSupply
        );
    }

    // Purchase specific amount of tokens
    function purchaseTokens(uint256 launchIndex, uint256 tokenAmount) public payable {
        require(launchIndex < tokenLaunches.length, "Invalid launch index");
        require(tokenAmount > 0, "Must purchase at least 1 token");
        
        TokenLaunch storage launch = tokenLaunches[launchIndex];
        require(launch.isLaunched, "Token launch not active");
        require(tokenAmount <= launch.remainingSupply, "Not enough tokens available");
        
        // Calculate required ETH based on token amount
        uint256 requiredEth = (tokenAmount * launch.launchPrice) / 10**18;
        require(msg.value >= requiredEth, "Insufficient funds sent");
        
        // Transfer tokens to buyer
        MemeToken token = MemeToken(launch.tokenAddress);
        token.transfer(msg.sender, tokenAmount);
        
        // Update launch data
        launch.totalRaised += msg.value;
        launch.remainingSupply -= tokenAmount;
        
        // Track user purchases
        userPurchases[msg.sender][launchIndex] += tokenAmount;
        
        // Refund excess ETH if any
        if (msg.value > requiredEth) {
            payable(msg.sender).transfer(msg.value - requiredEth);
        }

        emit TokenPurchased(msg.sender, launch.tokenAddress, tokenAmount, requiredEth);
    }

    // Calculate how many tokens you can get for a specific ETH amount
    function calculateTokenAmount(uint256 launchIndex, uint256 ethAmount) public view returns (uint256) {
        require(launchIndex < tokenLaunches.length, "Invalid launch index");
        TokenLaunch storage launch = tokenLaunches[launchIndex];
        
        uint256 tokenAmount = (ethAmount * 10**18) / launch.launchPrice;
        
        // Check if enough tokens are available
        if (tokenAmount > launch.remainingSupply) {
            return launch.remainingSupply;
        }
        
        return tokenAmount;
    }

    // Get remaining token supply for a specific launch
    function getRemainingSupply(uint256 launchIndex) public view returns (uint256) {
        require(launchIndex < tokenLaunches.length, "Invalid launch index");
        return tokenLaunches[launchIndex].remainingSupply;
    }
    
    // Get user purchase history for a specific launch
    function getUserPurchaseAmount(address user, uint256 launchIndex) public view returns (uint256) {
        require(launchIndex < tokenLaunches.length, "Invalid launch index");
        return userPurchases[user][launchIndex];
    }
    
    // Get token info by launch index
    function getTokenInfo(uint256 launchIndex) public view returns (
        address tokenAddress,
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 maxSupply,
        uint256 remainingSupply,
        uint256 launchPrice,
        uint256 totalRaised,
        bool isLaunched
    ) {
        require(launchIndex < tokenLaunches.length, "Invalid launch index");
        TokenLaunch storage launch = tokenLaunches[launchIndex];
        
        return (
            launch.tokenAddress,
            launch.name,
            launch.symbol,
            launch.initialSupply,
            launch.maxSupply,
            launch.remainingSupply,
            launch.launchPrice,
            launch.totalRaised,
            launch.isLaunched
        );
    }
    
    // Get count of active launches
    function getTokenLaunchCount() public view returns (uint256) {
        return tokenLaunches.length;
    }
    
    // Allow creator to pause their token launch
    function toggleLaunchStatus(uint256 launchIndex) public {
        require(launchIndex < tokenLaunches.length, "Invalid launch index");
        require(msg.sender == tokenLaunches[launchIndex].creator, "Only creator can toggle status");
        
        tokenLaunches[launchIndex].isLaunched = !tokenLaunches[launchIndex].isLaunched;
    }

    // Allow creator to withdraw their raised funds
    function withdrawLaunchFunds(uint256 launchIndex) public {
        require(launchIndex < tokenLaunches.length, "Invalid launch index");
        require(msg.sender == tokenLaunches[launchIndex].creator, "Only creator can withdraw funds");
        
        TokenLaunch storage launch = tokenLaunches[launchIndex];
        uint256 amount = launch.totalRaised;
        launch.totalRaised = 0;
        
        payable(launch.creator).transfer(amount);
    }

    function withdrawFees() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function updateLaunchFee(uint256 newFee) public onlyOwner {
        launchFee = newFee;
    }

    function getActiveLaunches() public view returns (TokenLaunch[] memory) {
        return tokenLaunches;
    }
}