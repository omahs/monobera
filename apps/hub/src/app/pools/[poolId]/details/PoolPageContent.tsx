"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound, useSearchParams } from "next/navigation";
import {
  Token,
  truncateHash,
  useBeraJs,
  useBgtInflation,
  usePollBalance,
  usePoolHistoricalData,
  usePoolRecentProvisions,
  usePoolRecentSwaps,
  type IProvision,
  type ISwaps,
  type PoolV2,
} from "@bera/berajs";
import { beraTokenAddress, blockExplorerUrl } from "@bera/config";
import {
  ApyTooltip,
  BgtStationBanner,
  FormattedNumber,
  PoolHeader,
  TokenIcon,
  TokenIconList,
} from "@bera/shared-ui";
import { truncateFloat } from "@bera/shared-ui";
import { cn } from "@bera/ui";
import { Button } from "@bera/ui/button";
import { Card, CardContent } from "@bera/ui/card";
import { Icons } from "@bera/ui/icons";
import { Separator } from "@bera/ui/separator";
import { Skeleton } from "@bera/ui/skeleton";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@bera/ui/tabs";
import { Address } from "viem";

import { EventTable } from "./PoolEventTable";
import { getPoolAddLiquidityUrl, getPoolWithdrawUrl } from "../../fetchPools";
import { usePool } from "~/b-sdk/usePool";
import { GqlPoolEventType } from "@bera/graphql/dex";
import { usePoolUserPosition } from "~/b-sdk/usePoolUserPosition";

const getTokenDisplay = (
  event: ISwapOrProvision | ISwaps | IProvision,
  pool: PoolV2 | undefined,
) => {
  if ((event as IProvision).changeType === undefined) {
    return (
      <div className="space-evenly flex flex-row items-center">
        <div className="flex items-center">
          <TokenIcon
            address={(event as ISwaps).swapIn?.address ?? "0x"}
            symbol={(event as ISwaps).swapIn?.symbol ?? ""}
          />
          <p className="ml-2">
            <FormattedNumber value={(event as ISwaps).swapInAmount} />
          </p>
        </div>
        <Icons.chevronRight className="mx-2" />
        <div className="flex items-center">
          <TokenIcon
            address={(event as ISwaps).swapOut?.address ?? "0x"}
            symbol={(event as ISwaps).swapOut?.symbol ?? ""}
          />
          <p className="ml-2">
            <FormattedNumber value={(event as ISwaps).swapOutAmount} />
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-evenly flex flex-row items-center">
      {pool?.tokens.map((token: Token, i) => {
        return (
          <div className={cn("flex flex-row", i !== 0 && "ml-[-10px]")} key={i}>
            <TokenIcon address={token.address} symbol={token.symbol} />
          </div>
        );
      })}
    </div>
  );
};

const getAction = (event: ISwapOrProvision | ISwaps | IProvision) => {
  if ((event as IProvision).changeType === undefined) {
    return <p>Swap</p>;
  }
  if ((event as IProvision).changeType === "mint") {
    return <p className="text-positive">Add</p>;
  }
  return <p className="text-destructive-foreground">Withdraw</p>;
};

enum Selection {
  AllTransactions = "allTransactions",
  Swaps = "swaps",
  AddsWithdrawals = "addsWithdrawals",
}

const TokenView = ({
  tokens,
  isLoading,
}: {
  tokens: {
    address: string;
    symbol: string;
    value: string | number;
    valueUSD?: string | number;
  }[];
  isLoading: boolean;
}) => {
  return (
    <>
      <div className="mb-4 text-sm font-medium">Tokens</div>
      <div>
        {isLoading ? (
          <div>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="mt-2 h-8 w-full" />
          </div>
        ) : (
          tokens?.map((token, index) => {
            return (
              <div
                className="flex h-8 items-center justify-between"
                key={`token-list-${index}-${token.address}-${token.value}`}
              >
                <div
                  className="group flex cursor-pointer gap-1"
                  onClick={() => {
                    if (token.address) {
                      window.open(
                        `${blockExplorerUrl}/address/${token.address}`,
                      );
                    }
                  }}
                >
                  <TokenIcon address={token.address} symbol={token.symbol} />
                  <div className="ml-1 font-medium uppercase group-hover:underline">
                    {token.address === beraTokenAddress
                      ? "wbera"
                      : token.symbol}
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="font-medium">
                    <FormattedNumber value={token.value} />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <FormattedNumber value={token.valueUSD ?? 0} symbol="USD" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

type ISwapOrProvision = ISwaps | IProvision;

export default function PoolPageContent({
  poolId,
}: {
  poolId: string;
}) {
  const { data, isLoading: isPoolLoading } = usePool({
    id: poolId,
  });

  const { v2Pool: pool, v3Pool } = data ?? {};
  useEffect(() => {
    console.log("POOL", pool, v3Pool);
  }, [v3Pool]);

  const { isConnected } = useBeraJs();
  const { data: userBalance, isLoading: isUserBalanceLoading } = usePollBalance(
    {
      address: pool?.address,
    },
  );

  const isLoading = isPoolLoading;

  const tvlInUsd =
    pool?.tokens.reduce((balance, curr) => {
      return (
        balance +
        parseFloat(curr.balance) * parseFloat(curr.token?.latestUSDPrice ?? "0")
      );
    }, 0) ?? 0;

  const { data: userPositionBreakdown } = usePoolUserPosition({ pool: pool });

  const userSharePercentage = userPositionBreakdown?.userSharePercentage ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <PoolHeader
        backHref="/pools/"
        title={
          isPoolLoading ? (
            <Skeleton className="h-10 w-40" />
          ) : (
            <>
              <TokenIconList
                tokenList={
                  pool?.tokens.map((t) => ({
                    address: t.address as Address,
                    symbol: t.symbol!,
                    decimals: t.decimals!,
                    name: t.symbol!,
                  })) ?? []
                }
                size="xl"
              />
              {pool?.name}
            </>
          )
        }
        subtitles={[
          // {
          //   title: "BGT APY",
          //   content: null,
          //   // content: isPoolLoading ? (
          //   //   <Skeleton className="h-4 w-8" />
          //   // ) : (
          //   //   <FormattedNumber
          //   //     value={calculateApy(
          //   //       pool?.wtv ?? "0",
          //   //       bgtInflation?.usdPerYear ?? 0,
          //   //     )}
          //   //     colored
          //   //     percent
          //   //   />
          //   // ),
          //   color: "warning",
          //   tooltip: <ApyTooltip />,
          // },
          {
            title: "Fee",
            content: isPoolLoading ? (
              <Skeleton className="h-4 w-8" />
            ) : (
              <>{pool?.swapFee}%</>
            ),
            color: "success",
          },
          {
            title: "Pool Contract",
            content: isPoolLoading ? (
              <Skeleton className="h-4 w-16" />
            ) : (
              <>{truncateHash(pool?.address ?? "")}</>
            ),
            externalLink: `${blockExplorerUrl}/address/${pool?.address}`,
          },
        ]}
        actions={
          <>
            <Link href={getPoolAddLiquidityUrl(pool)} target="_self">
              <Button variant="outline">
                <Icons.add />
                <span className="ml-1">Add</span>
              </Button>
            </Link>
            <Link href={getPoolWithdrawUrl(pool)} target="_self">
              <Button variant="outline">
                <Icons.subtract />
                <span className="ml-1">Withdraw</span>
              </Button>
            </Link>
          </>
        }
      />
      <Separator />
      {/* {isPoolLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <BgtStationBanner
          isHub
          receiptTokenAddress={pool?.address as Address}
          vaultAddress={pool?.id as Address}
        />
      )} */}
      <div className="w-full grid-cols-1 lg:grid-cols-12  gap-4 grid auto-rows-min">
        <div className="col-span-5 flex w-full flex-col gap-4 lg:col-span-7">
          {/* <PoolChart
            pool={pool}
            currentTvl={pool?.tvlUsd}
            historicalData={poolHistory}
            timeCreated={timeCreated}
            isLoading={isPoolHistoryLoading}
          /> */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="px-4 py-2">
              <div className="flex flex-row items-center justify-between">
                <div className="overflow-hidden truncate whitespace-nowrap text-sm ">
                  TVL
                </div>
              </div>
              <div className="overflow-hidden truncate whitespace-nowrap text-lg font-semibold">
                <FormattedNumber value={tvlInUsd ?? 0} symbol="USD" />
              </div>
            </Card>
            <Card className="px-4 py-2">
              <div className="flex flex-row items-center justify-between">
                <div className="overflow-hidden truncate whitespace-nowrap text-sm ">
                  Volume (24h)
                </div>
              </div>
              <div className="overflow-hidden truncate whitespace-nowrap text-lg font-semibold">
                <FormattedNumber value={v3Pool?.volume24h ?? 0} symbol="USD" />
              </div>
            </Card>
            <Card className="px-4 py-2">
              <div className="flex flex-row items-center justify-between">
                <div className="overflow-hidden truncate whitespace-nowrap text-sm ">
                  Fees (24h)
                </div>
              </div>
              <div className="overflow-hidden truncate whitespace-nowrap text-lg font-semibold">
                <FormattedNumber value={v3Pool?.fees24h ?? 0} symbol="USD" />
              </div>{" "}
            </Card>
            <Card className="px-4 py-2">
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-row items-center gap-1 overflow-hidden truncate whitespace-nowrap text-sm ">
                  APR
                </div>
              </div>
              <div className="overflow-hidden truncate whitespace-nowrap text-lg font-semibold text-warning-foreground">
                <FormattedNumber
                  value={v3Pool?.aprItems.at(0)?.apr ?? 0}
                  colored
                  percent
                />
              </div>
            </Card>
          </div>
        </div>
        <div className="flex w-full flex-col gap-5 lg:col-span-7 lg:col-start-1">
          <Card className="p-4">
            <div className="mb-4 flex h-8 w-full items-center justify-between text-lg font-semibold lg:mb-8">
              Pool Liquidity
              <div className="text-2xl">
                {isLoading ? (
                  <Skeleton className="h-10 w-20" />
                ) : (
                  <FormattedNumber value={tvlInUsd ?? 0} symbol="USD" />
                )}
              </div>
            </div>
            <TokenView
              isLoading={isPoolLoading}
              tokens={
                !pool
                  ? []
                  : pool.tokens?.map((t) => ({
                      address: t.address!,
                      symbol: t.symbol!,
                      value: parseFloat(t.balance),
                      valueUSD:
                        parseFloat(t.balance) *
                        parseFloat(t.token?.latestUSDPrice ?? "0"),
                    }))
              }
            />
          </Card>
        </div>
        {isConnected && (
          <div className="lg:col-span-5 lg:row-start-1 lg:col-start-8 lg:row-span-2">
            <Card>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="w-full ">
                  <div className="flex h-8 w-full items-center justify-between text-lg font-semibold">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      My pool balance
                    </h3>
                    <div className="text-2xl">
                      {isUserBalanceLoading ? (
                        <Skeleton className="h-[32px] w-[150px]" />
                      ) : (
                        <FormattedNumber
                          value={tvlInUsd * userSharePercentage}
                          symbol="USD"
                        />
                      )}
                    </div>
                  </div>
                  <div className="mt-4 lg:mt-8">
                    <TokenView
                      isLoading={isUserBalanceLoading || isPoolLoading}
                      tokens={
                        pool?.tokens?.map((t) => ({
                          address: t.address!,
                          symbol: t.symbol!,
                          value: parseFloat(t.balance) * userSharePercentage,
                          valueUSD:
                            parseFloat(t.balance) *
                            parseFloat(t.token?.latestUSDPrice ?? "0") *
                            userSharePercentage,
                        })) ?? []
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <Separator />
      <section>
        <Tabs
          defaultValue={Selection.AllTransactions}
          // onValueChange={(value: string) => setSelectedTab(value as Selection)}
        >
          <TabsList className="w-full" variant="compact">
            <TabsTrigger
              value={Selection.AllTransactions}
              className="w-full text-xs sm:text-sm"
              variant="compact"
            >
              All transactions
            </TabsTrigger>
            <TabsTrigger
              value={Selection.Swaps}
              variant="compact"
              className="w-full text-xs sm:text-sm"
            >
              Swaps
            </TabsTrigger>
            <TabsTrigger
              value={Selection.AddsWithdrawals}
              variant="compact"
              className="w-full text-xs sm:text-sm"
            >
              Adds &amp; Withdraws
            </TabsTrigger>
          </TabsList>
          <Card className="mt-4">
            <TabsContent
              value={Selection.AllTransactions}
              className="mt-0 overflow-x-auto"
            >
              <EventTable pool={pool} isLoading={isLoading} />
            </TabsContent>
            <TabsContent
              value={Selection.Swaps}
              className="mt-0 overflow-x-auto"
            >
              <EventTable
                pool={pool}
                types={[GqlPoolEventType.Swap]}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent
              value={Selection.AddsWithdrawals}
              className="mt-0 overflow-x-auto"
            >
              <EventTable
                pool={pool}
                types={[GqlPoolEventType.Add, GqlPoolEventType.Remove]}
                isLoading={isLoading}
              />
            </TabsContent>
          </Card>
          {/* <div className="mt-4 flex justify-center">{getLoadMoreButton()}</div> */}
        </Tabs>
      </section>
    </div>
  );
}
