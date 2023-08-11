"use client";

import { useEffect, useState } from "react";
import { useTokenInformation, type Token } from "@bera/berajs";
import { cn } from "@bera/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@bera/ui/avatar";

type Props = {
  token?: Token | undefined;
  fetch?: boolean;
  className?: string;
  address?: string;
};

export const TokenIcon = ({
  token,
  className,
  fetch = false,
  address,
}: Props) => {
  const [selectedToken, setSelectedToken] = useState<Token | undefined>(
    undefined,
  );
  const { read, tokenInformation } = useTokenInformation();

  useEffect(() => {
    const fetchData = async () => {
      if (fetch && address) {
        await read({ address: address });
      }
      if (tokenInformation && fetch) {
        setSelectedToken(tokenInformation);
      }
    };

    void fetchData();
  }, [read, token, fetch, tokenInformation]);

  return (
    <Avatar className={cn("h-6 w-6 rounded-full bg-muted", className)}>
      <AvatarImage
        src={fetch ? "" : token?.logoURI}
        className="rounded-full p-1"
      />
      <AvatarFallback className="text-xs font-bold">
        {fetch
          ? selectedToken?.symbol?.slice(0, 3)
          : token?.symbol?.slice(0, 3)}
      </AvatarFallback>
    </Avatar>
  );
};