/// <reference types="bun" />

import { createVlayerClient } from "@vlayer/sdk";
import proverSpec from "../out/VgrantGithubProver.sol/VgrantProver.json";
import verifierSpec from "../out/VgrantVerifier.sol/Vgrant.json";
import tokenSpec from "../out/token.sol/myToken.json";
import type { Abi } from "viem";
import { privateKeyToAccount } from 'viem/accounts';
import {
  getConfig,
  createContext,
  writeEnvVariables,
} from "@vlayer/sdk/config";

const issueId = 18;
const URL_TO_PROVE = "https://api.github.com/repos/b3ww/vGrant/issues/" + issueId;
const deployed = true;

const config = getConfig();
const { chain, ethClient, account, proverUrl, confirmations, notaryUrl } =
  createContext(config);

if (!account) {
  throw new Error(
    "No account found make sure EXAMPLES_TEST_PRIVATE_KEY is set in your environment variables",
  );
}

const pk2Raw = process.env.PK_2;
if (!pk2Raw) {
  throw new Error(
    "PK_2 not found in environment variables. Please ensure it is set.",
  );
}
const pk2 = pk2Raw.startsWith("0x") ? pk2Raw as `0x${string}` : `0x${pk2Raw}` as `0x${string}`;
const claimerAccount = privateKeyToAccount(pk2);
console.log("✅ Claimer account loaded:", claimerAccount.address);

let prover = process.env.VITE_PROVER_ADDRESS;
let verifier = process.env.VITE_VERIFIER_ADDRESS;
let tokenAddress = process.env.VITE_TOKEN_ADDRESS;

const vlayer = createVlayerClient({
  url: proverUrl,
  token: config.token,
});

async function generateIssueProof() {
  console.log("⏳ Generating issue proof...");
  const bearerToken = process.env.VITE_GITHUB_TOKEN;
  const result =
    await Bun.$`vlayer web-proof-fetch --notary ${notaryUrl} --url ${URL_TO_PROVE} --header "Authorization: Bearer ${bearerToken}"`;
  return result.stdout.toString();
}

async function generateGithubProof() {
  console.log("⏳ Generating github proof...");
  const bearerToken = process.env.VITE_GITHUB_TOKEN;
  const result =
    await Bun.$`vlayer web-proof-fetch --notary ${notaryUrl} --url ${URL_TO_PROVE} --header "Authorization: Bearer ${bearerToken}"`;
  return result.stdout.toString();
}

console.log("⏳ Deploying contracts...");

if (!deployed) {
const txHash1 = await ethClient.deployContract({
  abi: proverSpec.abi,
  bytecode: proverSpec.bytecode.object as `0x${string}`,
  args: [],
  account,
  chain,
});

prover = await ethClient.waitForTransactionReceipt({
  hash: txHash1,
  confirmations,
  retryCount: 60,
  retryDelay: 1000,
}).then((receipt) => receipt.contractAddress);
console.log("✅ Prover deployed", { prover });

// deploy erc20
const txhash3 = await ethClient.deployContract({
  abi: tokenSpec.abi,
  bytecode: tokenSpec.bytecode.object as `0x${string}`,
  args: [],
  account,
  chain,
});

tokenAddress = await ethClient.waitForTransactionReceipt({
  hash: txhash3,
  confirmations,
  retryCount: 60,
  retryDelay: 1000,
}).then((receipt) => receipt.contractAddress);
console.log("✅ Token deployed", { tokenAddress });


const txHash2 = await ethClient.deployContract({
  abi: verifierSpec.abi,
  bytecode: verifierSpec.bytecode.object as `0x${string}`,
  args: [prover, tokenAddress],
  account,
  chain,
});

verifier = await ethClient.waitForTransactionReceipt({
  hash: txHash2,
  confirmations,
  retryCount: 60,
  retryDelay: 1000,
}).then((receipt) => receipt.contractAddress);
console.log("✅ Verifier deployed", { verifier });

await writeEnvVariables(".env", {
  VITE_PROVER_ADDRESS: prover as `0x${string}`,
  VITE_VERIFIER_ADDRESS: verifier as `0x${string}`,
  VITE_TOKEN_ADDRESS: tokenAddress as `0x${string}`,
});

console.log("✅ Contracts deployed", { prover, verifier });
process.exit(0);
}

// verify user
const githubuserId = process.env.VITE_GITHUB_ID;

// const txHashverifyUser = await ethClient.writeContract({
//   address: verifier as `0x${string}`,
//   abi: verifierSpec.abi,
//   functionName: "verifyAccount",
//   args: [githubuserId],
//   account: claimerAccount,
//   chain,
// });
// await ethClient.waitForTransactionReceipt({
//   hash: txHashverifyUser,
//   confirmations,
//   retryCount: 60,
//   retryDelay: 1000,
// });

// console.log("✅ User verified", { githubuserId });

// approve token for bounty
// const txHashApproveBounty = await ethClient.writeContract({
//   address: tokenAddress as `0x${string}`,
//   abi: tokenSpec.abi,
//   functionName: "approve",
//   args: [verifier as `0x${string}`, 1000],
//   account,
//   chain,
// });
// await ethClient.waitForTransactionReceipt({
//   hash: txHashApproveBounty,
//   confirmations,
//   retryCount: 60,
//   retryDelay: 1000,
// });
// console.log("✅ token Bounty approved", { amount: 1000, verifier });

const deadline = Math.floor(Date.now() / 1000) + 60 * 60 * 50; // 50 hours from now
// const txHashAddBounty = await ethClient.writeContract({
//   address: verifier as `0x${string}`,
//   abi: verifierSpec.abi,
//   functionName: "addBounty",
//   args: [URL_TO_PROVE, issueId, 1000, deadline],
//   account,
//   chain,
// });
// await ethClient.waitForTransactionReceipt({
//   hash: txHashAddBounty,
//   confirmations,
//   retryCount: 60,
//   retryDelay: 1000,
// });
// console.log("✅ Bounty added", { URL_TO_PROVE, amount: 1000 });

// // approve bounty
// const txHashApproveBounty2 = await ethClient.writeContract({
//   address: verifier as `0x${string}`,
//   abi: verifierSpec.abi,
//   functionName: "approveBounty",
//   args: [URL_TO_PROVE],
//   account,
//   chain,
// });
// await ethClient.waitForTransactionReceipt({
//   hash: txHashApproveBounty2,
//   confirmations,
//   retryCount: 60,
//   retryDelay: 1000,
// });
// console.log("✅ Bounty approved", { URL_TO_PROVE });

const webProof = await generateIssueProof();

console.log("✅ Issue proof generated", { webProof });
console.log("⏳ start proving issue done");
console.log("⏳ Proving...");
const hash = await vlayer.prove({
  address: prover as `0x${string}`,
  functionName: "verifyIssue",
  proverAbi: proverSpec.abi as Abi,
  args: [
    {
      webProofJson: webProof.toString(),
    },
    "b3ww/vGrant",
    issueId.toString(),
  ],
  chainId: chain.id,
  gasLimit: config.gasLimit,
});

const result = await vlayer.waitForProvingResult({ hash });
console.log("✅ Proof :", { result });
const [proof, userId, status, issueUrl] = result as [string, string, string, string];
console.log("✅ Proof generated");

// user token balance before verification
const userBalanceBefore = await ethClient.readContract({
  address: tokenAddress as `0x${string}`,
  abi: tokenSpec.abi,
  functionName: "balanceOf",
  args: [claimerAccount.address],
  blockTag: "latest",
});
console.log("User token balance before verification (claimer):", userBalanceBefore.toString());


console.log("⏳ Verifying...");

// Workaround for viem estimating gas with `latest` block causing future block assumptions to fail on slower chains like mainnet/sepolia
const gas = await ethClient.estimateContractGas({
  address: verifier as `0x${string}`,
  abi: verifierSpec.abi,
  functionName: "verify",
  args: [proof, userId, status, issueUrl],
  account: claimerAccount,
  blockTag: "pending",
});

const txHash = await ethClient.writeContract({
  address: verifier as `0x${string}`,
  abi: verifierSpec.abi,
  functionName: "verify",
  args: [proof, userId, status, issueUrl],
  chain,
  account: claimerAccount,
  gas,
});

await ethClient.waitForTransactionReceipt({
  hash: txHash,
  confirmations,
  retryCount: 60,
  retryDelay: 1000,
});

console.log("✅ Verified!");

// user token balance after verification
const userBalanceAfter = await ethClient.readContract({
  address: tokenAddress as `0x${string}`,
  abi: tokenSpec.abi,
  functionName: "balanceOf",
  args: [claimerAccount.address],
  blockTag: "latest",
});
console.log("User token balance after verification (claimer):", userBalanceAfter.toString());