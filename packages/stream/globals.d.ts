declare module "@suiet/wallet-kit" {
  export interface WalletContextState {
    name: string | undefined;
    adapter: IWalletAdapter | undefined;
    account: WalletAccount | undefined;
    address: string | undefined;
    connecting: boolean;
    connected: boolean;
    status: "disconnected" | "connected" | "connecting";
  }
}
