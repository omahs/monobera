// import { BalancerSDK } from "@balancer-labs/sdk";

import { PoolWithMethods } from "@balancer-labs/sdk";
import useSWR from "swr";

import { balancerClient } from "./balancerClient";

export const usePools = () => {
  return useSWR("pools", async () => {
    try {
      return (await balancerClient.pools.all()) as PoolWithMethods[];
    } catch (error) {
      console.error("USEPOOLSERROR", error);
      throw error;
    }
  });
};
