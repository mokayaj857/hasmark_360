// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Hashmark {

    struct VideoProof {
        address creator;
        uint256 timestamp;
    }

    mapping(string => VideoProof) private proofs;

    event VideoAuthenticated(
        string videoHash,
        address indexed creator,
        uint256 timestamp
    );

    function authenticateVideo(string calldata videoHash) external {
        require(bytes(videoHash).length > 0, "Invalid hash");
        require(proofs[videoHash].timestamp == 0, "Already authenticated");

        proofs[videoHash] = VideoProof({
            creator: msg.sender,
            timestamp: block.timestamp
        });

        emit VideoAuthenticated(videoHash, msg.sender, block.timestamp);
    }

    function verifyVideo(string calldata videoHash)
        external
        view
        returns (address creator, uint256 timestamp)
    {
        require(proofs[videoHash].timestamp != 0, "Not authenticated");

        VideoProof memory proof = proofs[videoHash];
        return (proof.creator, proof.timestamp);
    }
}