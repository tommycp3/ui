import { createContext, FC, ReactNode, useContext } from "react";
import { CosmosApi } from "../apis/Api";
import { useNetwork } from "./NetworkContext";

const CosmosApiContext = createContext<CosmosApi>(null as any);

export const CosmosApiProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const { currentNetwork } = useNetwork();
    const api = new CosmosApi({ baseUrl: currentNetwork.rest!, secure: true });
    return <CosmosApiContext.Provider value={api}>{children}</CosmosApiContext.Provider>;
};

export const useCosmosApi = (): CosmosApi => {
    return useContext(CosmosApiContext);
};
