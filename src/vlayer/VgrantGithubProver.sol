// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {Proof} from "vlayer-0.1.0/Proof.sol";
import {Prover} from "vlayer-0.1.0/Prover.sol";
import {Web, WebProof, WebProofLib, WebLib} from "vlayer-0.1.0/WebProof.sol";


contract VgrantProver is Prover {
    using WebProofLib for WebProof;
    using WebLib for Web;

    string public constant DATA_URL = "https://api.github.com/repos/";

    string public constant DATA_URL_VGRANT = "https://back.vgrant.xyz/api/auth/me";

    function verifyGithub(WebProof calldata webProof, address account) public view returns (Proof memory, address, int256) {
        Web memory web = webProof.verify(DATA_URL_VGRANT);

        int256 id = web.jsonGetInt("github_id");

        return (proof(), account, id);
    }

    function verifyIssue(WebProof calldata webProof, string memory repo, string memory issueId) public view returns (Proof memory, int256, string memory, string memory) {
        string memory fullUrl = string(abi.encodePacked(DATA_URL, repo, "/issues/", issueId));
        Web memory web = webProof.verify(fullUrl);
        int256 userId = web.jsonGetInt("assignee.id");
        string memory status = web.jsonGetString("state_reason");
        string memory issueUrl = web.jsonGetString("url");
        require(keccak256(abi.encodePacked(status)) == keccak256(abi.encodePacked("completed")), "Issue is not completed");
        return (proof(), userId, status, issueUrl);
    }
}
