import React from "react";
import { useProfileAvatar } from "../../context/profile/ProfileAvatarContext";
import { ETH_CHAIN_ID } from "../../config/constants";
import { createAuthPayload } from "../../utils/cosmos/signing";
import { buildPlayerAvatar } from "../../utils/profile/avatarPayload";
import styles from "./ProfileAvatarDrawer.module.css";

const PROFILE_NFT_CHAIN_ID = Number(import.meta.env.VITE_PROFILE_NFT_CHAIN_ID || ETH_CHAIN_ID);
const PROFILE_AVATAR_DEBUG = import.meta.env.DEV && ["1", "true"].includes((import.meta.env.VITE_DEBUG_AVATAR_SYNC || "").toLowerCase());

export const ProfileAvatarDrawer: React.FC = () => {
    const [debugCopyStatus, setDebugCopyStatus] = React.useState<string | null>(null);
    const {
        isDrawerOpen,
        closeDrawer,
        isWalletConnected,
        walletAddress,
        openConnectModal,
        walletNfts,
        isLoadingNfts,
        nftsError,
        nftsWarning,
        selectedAvatar,
        selectAvatar,
        clearAvatar,
        refreshWalletNfts,
        hasSourceConfigured,
        sourceMode
    } = useProfileAvatar();

    const handleCopyDebugPayload = React.useCallback(async () => {
        if (!selectedAvatar) {
            setDebugCopyStatus("Select an avatar first.");
            return;
        }

        try {
            const authPayload = await createAuthPayload();
            if (!authPayload) {
                setDebugCopyStatus("Missing signing auth payload.");
                return;
            }

            const payload = {
                playerAddress: authPayload.playerAddress,
                timestamp: authPayload.timestamp,
                signature: authPayload.signature,
                avatar: buildPlayerAvatar({
                    chainId: PROFILE_NFT_CHAIN_ID,
                    contractAddress: selectedAvatar.contractAddress,
                    tokenId: selectedAvatar.tokenId,
                    imageUrl: selectedAvatar.imageUrl
                })
            };

            await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
            setDebugCopyStatus("Debug payload copied.");
        } catch {
            setDebugCopyStatus("Failed to copy debug payload.");
        }
    }, [selectedAvatar]);

    React.useEffect(() => {
        if (!debugCopyStatus) {
            return;
        }

        const timer = window.setTimeout(() => {
            setDebugCopyStatus(null);
        }, 2500);

        return () => {
            window.clearTimeout(timer);
        };
    }, [debugCopyStatus]);

    if (!isDrawerOpen) {
        return null;
    }

    return (
        <>
            <div className={styles.overlay} onClick={closeDrawer} />
            <aside className={styles.drawer}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Select Profile Avatar</h2>
                    <button onClick={closeDrawer} className={styles.closeButton}>
                        ✕
                    </button>
                </div>

                <div className={styles.content}>
                    {!isWalletConnected ? (
                        <>
                            <p className={styles.emptyText}>Connect your Web3 wallet to scan NFTs for profile avatars.</p>
                            <button className={styles.actionButton} onClick={openConnectModal}>Connect Wallet</button>
                        </>
                    ) : (
                        <>
                            <p className={styles.meta}>Wallet: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</p>
                            <div className="flex gap-2">
                                <button className={styles.actionButton} onClick={refreshWalletNfts}>Refresh NFTs</button>
                                <button className={styles.actionButton} onClick={clearAvatar}>Clear Avatar</button>
                            </div>

                            {PROFILE_AVATAR_DEBUG && (
                                <>
                                    <button className={styles.actionButton} onClick={handleCopyDebugPayload}>Copy Debug Payload</button>
                                    {debugCopyStatus && <p className={styles.meta}>{debugCopyStatus}</p>}
                                </>
                            )}

                            {!hasSourceConfigured && (
                                <p className={styles.emptyText}>
                                    {sourceMode === "collections"
                                        ? "No profile NFT contracts configured. Set VITE_PROFILE_NFT_CONTRACTS."
                                        : "No wallet NFT indexer configured. Set VITE_PROFILE_NFT_INDEXER_URL or VITE_ALCHEMY_URL."}
                                </p>
                            )}

                            {isLoadingNfts && <p className={styles.emptyText}>Scanning wallet NFTs...</p>}
                            {nftsError && <p className={styles.emptyText}>{nftsError}</p>}
                            {nftsWarning && <p className={styles.emptyText}>{nftsWarning}</p>}

                            {!isLoadingNfts && walletNfts.length === 0 && hasSourceConfigured && !nftsError && (
                                <p className={styles.emptyText}>
                                    {sourceMode === "collections"
                                        ? "No NFTs found in configured collections."
                                        : "No NFTs found in this wallet."}
                                </p>
                            )}

                            {walletNfts.map(asset => {
                                const isSelected =
                                    selectedAvatar?.contractAddress.toLowerCase() === asset.contractAddress.toLowerCase() &&
                                    selectedAvatar?.tokenId === asset.tokenId;

                                return (
                                    <button
                                        key={asset.id}
                                        className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`.trim()}
                                        onClick={() => selectAvatar(asset)}
                                    >
                                        <img src={asset.imageUrl} alt={asset.name || `NFT #${asset.tokenId}`} className={styles.nftImage} />
                                        <p className={styles.meta}>{asset.collectionName || "Collection"} • #{asset.tokenId}</p>
                                    </button>
                                );
                            })}
                        </>
                    )}
                </div>
            </aside>
        </>
    );
};

export default ProfileAvatarDrawer;
