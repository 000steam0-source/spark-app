import SparkMark from "@/shared/ui/SparkMark";

// faint oversized sparkle tucked into the card corner
export default function LogoPattern() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-[60px] -right-[50px] text-text-primary opacity-[0.05] blur-[2px]"
    >
      <SparkMark size={260} />
    </span>
  );
}
