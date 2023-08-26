import { Tooltip } from "@bera/shared-ui";
import { FormControl, FormField, FormItem, FormMessage } from "@bera/ui/form";
import { Input } from "@bera/ui/input";
import { type UseFormReturn } from "react-hook-form";

export default function NewGaugeForm({ form }: { form: UseFormReturn<any> }) {
  return (
    <>
      <FormField
        control={form.control}
        name="gaugeAddress"
        render={({ field }) => (
          <FormItem className="inline-flex flex-col justify-start">
            <div className="text-sm font-semibold leading-tight">
              Gauge Address <Tooltip text="the address receiving rewards" />
            </div>
            <div>
              <FormControl>
                <Input
                  type="text"
                  id="forum-discussion-link"
                  placeholder="0x0000...0000"
                  {...field}
                />
              </FormControl>
              <FormMessage className="mt-2" />
            </div>
          </FormItem>
        )}
      />
    </>
  );
}
