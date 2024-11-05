import { PoolWithMethods } from "@balancer-labs/sdk";
import useSWR from "swr";

import { balancerClient } from "./balancerClient";

export const usePools = () => {
  // TODO: we should use v3 SDK here instead for better typing on the returned pools
  return useSWR("pools", async () => {
    try {
      return (await balancerClient.pools.all()) as PoolWithMethods[];
    } catch (error) {
      console.error("USEPOOLSERROR", error);
      throw error;
    }
  });
};
