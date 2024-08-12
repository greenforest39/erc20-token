const { expect } = require("chai");
const { ethers } = require("hardhat");
const { takeSnapshot, revertToSnapshot } = require("./utils/snapshot");
const { signEmergencyTransfer } = require("./utils/sign");

describe("Token", function () {
  let deployer;
  let user1;
  let user2;
  let user1Backup;
  let user2Backup;

  let token;

  let snapshotId;

  before(async () => {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    user1 = signers[1];
    user2 = signers[2];
    user1Backup = signers[3];
    user2Backup = signers[4];

    const totalSupply = ethers.utils.parseEther("1000000");

    const TokenFactory = await ethers.getContractFactory("Token");
    token = await TokenFactory.connect(deployer).deploy(
      "Token",
      "TOKEN",
      totalSupply
    );
    await token.deployed();

    expect(await token.balanceOf(deployer.address)).to.be.eq(totalSupply);

    // transfer user1, user 10000 tokens each
    const userBalance = ethers.utils.parseEther("10000");
    await token.connect(deployer).transfer(user1.address, userBalance);
    await token.connect(deployer).transfer(user2.address, userBalance);

    expect(await token.balanceOf(user1.address)).to.be.eq(userBalance);
    expect(await token.balanceOf(user2.address)).to.be.eq(userBalance);
  });

  beforeEach(async function () {
    snapshotId = await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot(snapshotId);
  });

  it("should deploy contract", async function () {});

  it("should register backup address", async function () {
    await expect(
      token.connect(user1Backup).registerBackUpAddress(user2Backup.address)
    ).to.be.revertedWith("not token holder");

    const r = await token
      .connect(user1)
      .registerBackUpAddress(user1Backup.address);
    expect(r)
      .to.emit(token, "BackupAddressRegistered")
      .withArgs(user1.address, user1Backup.address);

    const backup = await token.backupAddress(user1.address);
    expect(backup).to.be.eq(user1Backup.address);
  });

  it("should emergency transfer tokens", async function () {
    const { v, r, s } = await signEmergencyTransfer(user1, token.address);

    await token.connect(user1).registerBackUpAddress(user1Backup.address);

    const user1Balance = await token.balanceOf(user1.address);

    const tx = await token
      .connect(user2)
      .emergencyTransfer(user1.address, v, r, s);

    expect(tx)
      .to.emit(token, "EmergencyTransfer")
      .withArgs(
        user2.address,
        user1.address,
        user1Backup.address,
        user1Balance
      );

    expect(await token.balanceOf(user1.address)).to.be.eq(0);
    expect(await token.balanceOf(user1Backup.address)).to.be.eq(user1Balance);

    expect(await token.blacklisted(user1.address)).to.be.eq(true);
  });

  it("should not emergency transfer tokens with wrong signature", async function () {
    const { v, r, s } = await signEmergencyTransfer(user2, token.address);

    await token.connect(user1).registerBackUpAddress(user1Backup.address);

    await expect(
      token.connect(user2).emergencyTransfer(user1.address, v, r, s)
    ).to.be.revertedWith("invalid signature");
  });

  it("should transfer tokens to prev backup address if blacklisted", async function () {
    const { v, r, s } = await signEmergencyTransfer(user1, token.address);

    await token.connect(user1).registerBackUpAddress(user1Backup.address);

    const user1Balance = await token.balanceOf(user1.address);

    await token.connect(user2).emergencyTransfer(user1.address, v, r, s);

    // tokens should be transferred to user1Backup
    const user2Balance = await token.balanceOf(user2.address);
    await token.connect(user2).transfer(user1.address, user2Balance);

    expect(await token.balanceOf(user2.address)).to.be.eq(0);
    expect(await token.balanceOf(user1Backup.address)).to.be.eq(
      user1Balance.add(user2Balance)
    );
  });
});
