const { ethers } = require("hardhat");

const signEmergencyTransfer = async (signer, contract) => {
  const chainId = ethers.BigNumber.from(await signer.getChainId());
  const domain = {
    name: "Approve Emergency Transfer",
    version: "1",
    chainId,
    verifyingContract: contract,
  };
  const types = {
    EmergencyTransfer: [
      {
        name: "from",
        type: "address",
      },
    ],
  };
  const rawSignature = await signer._signTypedData(domain, types, {
    from: signer.address,
  });
  const signature = ethers.utils.splitSignature(rawSignature);
  return {
    r: signature.r,
    s: signature.s,
    v: signature.v,
  };
};

module.exports = {
  signEmergencyTransfer,
};
