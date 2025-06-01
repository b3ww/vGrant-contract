// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import {Proof} from "vlayer-0.1.0/Proof.sol";
import {Verifier} from "vlayer-0.1.0/Verifier.sol";
import {IERC20} from "@openzeppelin-contracts-5.0.1/token/ERC20/IERC20.sol";
import "@openzeppelin-contracts-5.0.1/utils/Strings.sol";

import {VgrantProver} from "./VgrantGithubProver.sol";

contract Vgrant is Verifier {
    using Strings for uint256;
    address public prover;
    address private immutable owner;
    mapping(int256 id => address ) public accounts;
    IERC20 public bountyToken;

    struct Bounty {
        address author;
        string repo;
        uint256 issueId;
        uint256 bounty;
        uint256 deadline;
        bool approved;
        bool claimed;
    }
    mapping(string repo => Bounty) public bounties;
    mapping(string issue => bool) public bountyExists;

    event BountyAdded(string repo, uint256 issueId, uint256 bounty, uint256 deadline);
    event BountyApproved(string issue, uint256 bounty, uint256 deadline, address author);
    event BountyClosed(string issue);
    event BountyClaimed(string issue, uint256 bounty, address dev, int256 githubId);
    event BountyIncreasedDeadline(string issue, uint256 newDeadline, uint256 oldDeadline);
    event AccountVerified(address account, int256 id);

    constructor(address _prover, address _bountyToken) {
        require(_bountyToken != address(0), "Bounty token address cannot be zero");
        require(_prover != address(0), "Prover address cannot be zero");
        require(_prover != msg.sender, "Prover cannot be the same as verifier");
        bountyToken = IERC20(_bountyToken);
        owner = msg.sender;
        prover = _prover;
    }

    function verifyAccount(Proof calldata, address _account, int256 _userId) public onlyVerified(prover, VgrantProver.verifyGithub.selector) {
        require(accounts[_userId] == address(0), "Account already verified");
        require(_userId > 0, "User ID must be greater than zero");
        require(_account != address(0), "Account address cannot be zero");
        accounts[_userId] = _account;
        emit AccountVerified(_account, _userId);
    }

    function isVerified(int256 _userId) public view returns (bool) {
        return accounts[_userId] != address(0);
    }

    // url need to be "https://github.com/b3ww/vGrant/issues/2" for example
    function addBounty(string memory _url, uint256 _issueId, uint256 _bounty, uint256 _deadline) public {
        // get full issue identifier (concat repo and issueId)
        require(bountyExists[_url] == false, "Bounty already exists for this issue");
        require(_bounty > 0, "Bounty must be greater than zero");

        // check token allowance and balance for the bounty
        require(IERC20(bountyToken).allowance(msg.sender, address(this)) >= _bounty, "Insufficient allowance for bounty");
        require(IERC20(bountyToken).balanceOf(msg.sender) >= _bounty, "Insufficient balance for bounty");
        require(_deadline > block.timestamp && _deadline > block.timestamp + 48 hours, "Deadline must be more than 48h from now");

        // transfer bounty to contract
        IERC20(bountyToken).transferFrom(msg.sender, address(this), _bounty);

        bounties[_url] = Bounty({
            author: msg.sender,
            repo: _url,
            issueId: _issueId,
            bounty: _bounty,
            deadline: _deadline,
            approved: false,
            claimed: false
        });
        bountyExists[_url] = true;
        emit BountyAdded(_url, _issueId, _bounty, _deadline);
    }

    function getBounty(string memory _issue) public view returns (Bounty memory) {
        require(bountyExists[_issue], "Bounty does not exist");
        Bounty storage bounty = bounties[_issue];
        return bounty;
    }

    function increasebountyDeadline(string memory _issue, uint256 _newDeadline) public {
        Bounty storage bounty = bounties[_issue];
        require(bounty.author == msg.sender, "Only author can increase deadline");
        require(!bounty.approved, "Bounty already approved");
        require(!bounty.claimed, "Bounty already claimed");
        require(_newDeadline > bounty.deadline, "New deadline must be greater than current");

        uint256 oldDeadline = bounty.deadline;
        bounty.deadline = _newDeadline;
        emit BountyIncreasedDeadline(_issue, _newDeadline, oldDeadline);
    }

    function closeBounty(string memory _issue) public {
        Bounty storage bounty = bounties[_issue];
        require(bounty.author == msg.sender, "Only author can close bounty");

        if (bounty.approved) {
            require(block.timestamp >= bounty.deadline, "Bounty deadline not passed yet");
            require(!bounty.claimed, "Bounty already claimed");
        }

        delete bounties[_issue];
        bountyExists[_issue] = false;
        emit BountyClosed(_issue);

        // transfer bounty back to author
        IERC20(bountyToken).transfer(bounty.author, bounty.bounty);
    }

    function approveBounty(string memory _issue) public {
        Bounty storage bounty = bounties[_issue];
        require(bounty.author == address(msg.sender), "your not the author of this bounty");
        bounty.approved = true;
        emit BountyApproved(_issue, bounty.bounty, bounty.deadline, bounty.author);
    }

    function verify(Proof calldata, int256 userId, string memory status, string memory url) public onlyVerified(prover, VgrantProver.verifyIssue.selector) {
        require(keccak256(abi.encodePacked(status)) == keccak256(abi.encodePacked("completed")), "Issue is not completed");
        require(accounts[userId] != address(0), "User not verified");
        require(bountyExists[url], "Bounty does not exist for this issue");
        Bounty storage bounty = bounties[url];
        require(bounty.approved, "Bounty not approved yet");
        require(!bounty.claimed, "Bounty already claimed");
        require(block.timestamp < bounty.deadline, "Bounty deadline passed");
        require(bounty.author != msg.sender, "Author cannot claim their own bounty");
        bounty.claimed = true;
        emit BountyClaimed(url, bounty.bounty, accounts[userId], userId);
        IERC20(bountyToken).transfer(msg.sender, bounty.bounty);
    }
}
