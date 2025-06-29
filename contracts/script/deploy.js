const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    
    console.log(`📡 Deploying on ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`🔑 Deployer: ${deployer.address}`);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
    
    if (balance < ethers.parseEther("0.01")) {
        console.log("⚠️  Warning: Low balance for deployment");
    }

    console.log("\n🚀 Deploying TimeSlot contract...");
    
    try {
        // Get ContractFactory
        const TimeSlot = await ethers.getContractFactory("TimeSlot");
        
        // Deploy with deployer as initial owner
        console.log("📋 Constructor args: initialOwner =", deployer.address);
        const contract = await TimeSlot.deploy(deployer.address);
        
        console.log("⏳ Waiting for deployment confirmation...");
        await contract.waitForDeployment();
        
        const contractAddress = await contract.getAddress();
        console.log(`✅ TimeSlot contract deployed successfully!`);
        console.log(`📍 Contract address: ${contractAddress}`);
        
        // Verify deployment by calling a view function
        console.log("\n🔍 Verifying deployment...");
        const owner = await contract.owner();
        const name = await contract.name();
        const symbol = await contract.symbol();
        const nextTokenId = await contract.nextTokenId();
        
        console.log(`✓ Contract owner: ${owner}`);
        console.log(`✓ Token name: ${name}`);
        console.log(`✓ Token symbol: ${symbol}`);
        console.log(`✓ Next token ID: ${nextTokenId}`);
        
        // Calculate deployment cost
        const deploymentTx = contract.deploymentTransaction();
        if (deploymentTx) {
            const receipt = await deploymentTx.wait();
            const gasUsed = receipt.gasUsed;
            const gasPrice = deploymentTx.gasPrice;
            const deploymentCost = gasUsed * gasPrice;
            
            console.log(`\n💸 Deployment cost: ${ethers.formatEther(deploymentCost)} ETH`);
            console.log(`⛽ Gas used: ${gasUsed.toString()}`);
        }
        
        // Output configuration
        console.log(`\n📋 Configuration for frontend/testing:`);
        console.log(`CONTRACT_ADDRESS=${contractAddress}`);
        console.log(`OWNER_ADDRESS=${deployer.address}`);
        console.log(`NETWORK=${network.name}`);
        console.log(`CHAIN_ID=${network.chainId}`);
        
        if (network.chainId === 31337n || network.chainId === 1337n) {
            console.log(`RPC_URL=http://127.0.0.1:8545`);
            console.log(`\n🏠 Local development detected`);
            console.log(`👉 Start hardhat node: npx hardhat node`);
            console.log(`👉 Deploy: npx hardhat run scripts/deploy.js --network localhost`);
        }
        
        return {
            contractAddress,
            owner: deployer.address,
            networkName: network.name,
            chainId: network.chainId
        };
        
    } catch (error) {
        console.error("\n❌ Deployment failed:");
        console.error(error.message);
        
        if (error.message.includes("insufficient funds")) {
            console.log("\n💡 Solutions:");
            console.log("- Fund your deployer account with ETH");
            console.log("- Use a test network faucet");
            console.log("- Check if hardhat node is running for local deployment");
        }
        
        throw error;
    }
}

// Execute deployment
if (require.main === module) {
    main()
        .then((result) => {
            console.log("\n🎉 Deployment completed successfully!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("\n💥 Fatal error during deployment:");
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;
