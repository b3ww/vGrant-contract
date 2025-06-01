# print env vars
echo "VITE_VERIFIER_ADDRESS: $VITE_VERIFIER_ADDRESS"
echo "VITE_TOKEN_ADDRESS: $VITE_TOKEN_ADDRESS"
# print env vars

cast send $VITE_TOKEN_ADDRESS "approve(address,uint256)" $VITE_VERIFIER_ADDRESS 100 --rpc-url https://sepolia.optimism.io --private-key 0x824b135f7ec89484e420e9923008b1e67bdc8f5fb1e1c6cd41f8477b7e10d7c8
sleep 1
cast send $VITE_VERIFIER_ADDRESS "addBounty(string,uint256,uint256,uint256)" "https://api.github.com/repos/b3ww/vGrant/issues/18" 18 100 1756689466 --rpc-url https://sepolia.optimism.io --private-key 0x824b135f7ec89484e420e9923008b1e67bdc8f5fb1e1c6cd41f8477b7e10d7c8
sleep 1
cast send $VITE_VERIFIER_ADDRESS "approveBounty(string)" "https://api.github.com/repos/b3ww/vGrant/issues/18" --rpc-url https://sepolia.optimism.io --private-key 0x824b135f7ec89484e420e9923008b1e67bdc8f5fb1e1c6cd41f8477b7e10d7c8
sleep 1
cast send $VITE_VERIFIER_ADDRESS "test_verifyAccount(address,int256)" 0xED8f759d9D5c6D9f783509ab4B838099CaaB50d9 78302154 --rpc-url https://sepolia.optimism.io --private-key 0xea8a4e3e2ee824b7007923684fdafc1332e8c8579ac0bb786e52ab2ea0fa1559
sleep 1
cast call $VITE_TOKEN_ADDRESS "balanceOf(address)(uint256)" 0xED8f759d9D5c6D9f783509ab4B838099CaaB50d9 --rpc-url https://sepolia.optimism.io