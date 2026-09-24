import { Check } from "lucide-react";

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "md" ? "h-[38px] w-[38px] rounded-[10px]" : "h-8 w-8 rounded-lg";
  return (
    <div className={`flex ${box} shrink-0 items-center justify-center bg-yellow text-bg-deep`}>
      <Check className={size === "md" ? "h-5 w-5" : "h-4 w-4"} strokeWidth={3} />
    </div>
  );
}
