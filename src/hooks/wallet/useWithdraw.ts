import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { abi } from "../../abis/contractABI";
import useUserWalletConnect from "./useUserWalletConnect";
import { FunctionName } from "../../types";
import { useCallback, useMemo, useEffect } from "react";
import { COSMOS_BRIDGE_ADDRESS } from "../../config/constants";

const useWithdraw = () => {
  const BRIDGE_ADDRESS = COSMOS_BRIDGE_ADDRESS;
  const { data: hash, isPending, mutate, error } = useWriteContract();
  const { address: userAddress } = useUserWalletConnect();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash
  });

  // Log errors
  useEffect(() => {
    if (error) {
      console.error("[useWithdraw] Transaction error:", error);
    }
  }, [error]);

  const withdraw = useCallback(async (
    nonce: string,
    receiver: string,
    amount: bigint,
    signature: string
  ): Promise<void> => {
    if (!userAddress) {
      console.error("[useWithdraw] User wallet is not connected");
      throw new Error("MetaMask wallet is not connected");
    }

    if (!nonce || !receiver || amount <= 0n || !signature) {
      console.error("[useWithdraw] Invalid parameters:", { nonce, receiver, amount: amount.toString(), signature });
      throw new Error("Invalid withdrawal parameters");
    }

    // Contract ABI: withdraw(uint256 amount, address receiver, bytes32 nonce, bytes signature)
    console.log("[useWithdraw] Calling withdraw with params:", {
      bridgeAddress: BRIDGE_ADDRESS,
      amount: amount.toString(),
      receiver,
      nonce,
      signatureLength: signature.length,
      signature: signature.slice(0, 20) + "..."
    });

    mutate(
      {
        address: BRIDGE_ADDRESS as `0x${string}`,
        abi: abi,
        functionName: FunctionName.Withdraw,
        args: [
          amount,
          receiver as `0x${string}`,
          nonce as `0x${string}`,
          signature as `0x${string}`
        ]
      },
      {
        onSuccess: (hash) => {
          console.log("[useWithdraw] Transaction submitted, hash:", hash);
        },
        onError: (err) => {
          console.error("[useWithdraw] mutate onError:", err);
        }
      }
    );
  }, [userAddress, mutate, BRIDGE_ADDRESS]);

  return useMemo(
    () => ({
      withdraw,
      hash,
      isLoading: isPending,
      isWithdrawPending: isConfirming,
      isWithdrawConfirmed: isConfirmed,
      withdrawError: error
    }),
    [withdraw, hash, isPending, isConfirming, isConfirmed, error]
  );
};

export { useWithdraw };
export default useWithdraw;
