import { BN } from "bn.js";

import AptosStreamClient from "../../aptos/StreamClient";
import { ICluster } from "../../common/types";

describe("AptosStreamClient", () => {
  describe("init", () => {
    it("should successfully create AptosStreamInstance", () => {
      const instance = new AptosStreamClient(ICluster.Devnet);

      expect(instance).toBeInstanceOf(AptosStreamClient);
    });

    it("should correctly set passed params", () => {
      const pid = "PID";
      const gas = "30";
      const instance = new AptosStreamClient("https://cluster", ICluster.Devnet, gas, pid);

      expect(instance.getMaxGas()).toEqual({ max_gas_amount: gas });
      expect(instance.getProgramId()).toBe(pid);
    });
  });

  describe("create", () => {
    const pid = "PID";
    const gas = "30";
    let instance = new AptosStreamClient("https://cluster", ICluster.Devnet, gas, pid);

    beforeEach(() => {
      instance = new AptosStreamClient("https://cluster", ICluster.Devnet, gas, pid);
    });

    test("should create a stream with passed parameters", async () => {
      // Arrange
      const mockSigner = jest.fn();
      const mockWallet: any = {
        signAndSubmitTransaction: mockSigner,
        account: { address: "" },
      };
      const mockRecipient = {
        recipient: "0xtest",
        amount: new BN(1000),
        name: "test name",
        cliffAmount: new BN(1),
        amountPerPeriod: new BN(1),
      };
      const mockData = {
        period: 100,
        start: 10,
        cliff: 12,
        cancelableBySender: true,
        cancelableByRecipient: false,
        transferableBySender: false,
        transferableByRecipient: true,
        canTopup: true,
        automaticWithdrawal: false,
        withdrawalFrequency: 10,
        tokenId: "0xtest::token::Token",
        canPause: false,
        canUpdateRate: false,
      };
      const mockReturn = "hash";
      mockSigner.mockResolvedValue({ hash: mockReturn });

      // Act
      const result = await instance.create(
        {
          ...mockData,
          ...mockRecipient,
        },
        { senderWallet: mockWallet }
      );

      // Assert
      expect(mockSigner).toHaveBeenCalledTimes(1);
      const callParam = mockSigner.mock.calls[0][0];
      const args = callParam.arguments;
      delete callParam.arguments;
      args.shift();
      expect(args).toEqual([
        mockRecipient.amount.toString(),
        100,
        mockRecipient.amountPerPeriod.toString(),
        10,
        mockRecipient.cliffAmount.toString(),
        true,
        false,
        false,
        true,
        true,
        false,
        false,
        false,
        10,
        "test name",
        "0xtest",
      ]);
      expect(callParam).toEqual({
        function: "PID::protocol::create",
        type: "create",
        type_arguments: ["0xtest::token::Token"],
      });
      expect(result.txId).toEqual(mockReturn);
    });
  });

  // describe("createMultiple", () => {

  // });

  // describe("withdraw", () => {

  // });

  // describe("cancel", () => {

  // });

  // describe("transfer", () => {

  // });

  // describe("topup", () => {

  // });

  // describe("getOne", () => {

  // });
});
