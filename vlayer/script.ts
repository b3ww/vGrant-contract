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

const issueId = process.env.ISSUE_ID;
const repo = process.env.REPO || "b3ww/vGrant";
const URL_TO_PROVE = "https://api.github.com/repos/" + repo + "/issues/" + issueId;

const config = getConfig();
const { chain, ethClient, account, proverUrl, confirmations, notaryUrl } =
  createContext(config);

if (!account) {
  throw new Error(
    "No account found make sure EXAMPLES_TEST_PRIVATE_KEY is set in your environment variables",
  );
}

let prover = process.env.VITE_PROVER_ADDRESS;
let verifier = process.env.VITE_VERIFIER_ADDRESS;

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

console.log("⏳ Deploying contracts...");

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
    repo,
    issueId.toString(),
  ],
  chainId: chain.id,
  gasLimit: config.gasLimit,
});

const result = await vlayer.waitForProvingResult({ hash });
console.log("✅ Proof :", { result });
const [proof, userId, status, issueUrl] = result as [string, string, string, string];
console.log("✅ Proof generated");


console.log("⏳ Verifying...");

// Workaround for viem estimating gas with `latest` block causing future block assumptions to fail on slower chains like mainnet/sepolia
const gas = await ethClient.estimateContractGas({
  address: verifier as `0x${string}`,
  abi: verifierSpec.abi,
  functionName: "verify",
  args: [proof, userId, status, issueUrl],
  account: account,
  blockTag: "pending",
});

const txHash = await ethClient.writeContract({
  address: verifier as `0x${string}`,
  abi: verifierSpec.abi,
  functionName: "verify",
  args: [proof, userId, status, issueUrl],
  chain,
  account: account,
  gas,
});

await ethClient.waitForTransactionReceipt({
  hash: txHash,
  confirmations,
  retryCount: 60,
  retryDelay: 1000,
});

console.log("✅ Verified!");