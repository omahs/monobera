import { type Metadata } from "next";

import { getMetaTitle } from "@bera/shared-ui";
import CreatePageContent2 from "./CreatePageContent2";
import { dexName } from "@bera/config";

export const metadata: Metadata = {
  title: getMetaTitle("Create Pool", dexName),
  description: "Create a custom pool",
};

export default function Create() {
  return (
    <div className="container m-auto flex w-full flex-col items-center gap-5">
      <CreatePageContent2 />
    </div>
  );
}
