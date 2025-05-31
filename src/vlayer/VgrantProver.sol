// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {Proof} from "vlayer-0.1.0/Proof.sol";
import {Prover} from "vlayer-0.1.0/Prover.sol";
import {Web, WebProof, WebProofLib, WebLib} from "vlayer-0.1.0/WebProof.sol";


contract VgrantProver is Prover {
    using WebProofLib for WebProof;
    using WebLib for Web;

    string public constant DATA_URL = "https://api.github.com/repos/b3ww/vGrant/issues/2";

    function verifyIssue(WebProof calldata webProof) public view returns (Proof memory, int256) {
        Web memory web = webProof.verify(DATA_URL);

        int256 userId = web.jsonGetInt("assignee.id");

        return (proof(), userId);
    }
}
