import type { CSSProperties, ReactNode } from "react";

export interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  marginTop?: string;
}

const headingStyle: CSSProperties = {
  fontFamily: "var(--font-inter), sans-serif",
  fontWeight: 800,
  letterSpacing: "-0.035em",
};

export function SectionHeading({
  title,
  subtitle,
  icon,
  badge,
  marginTop = "mt-[22px]",
}: SectionHeadingProps) {
  return (
    <div className={`${marginTop} px-4 flex items-center justify-between`}>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="h-[22px] w-[4px] rounded-full spark-gradient-bg" />

          <h2
            className="font-roboto-flex-heading text-text-primary text-[25px] m-0 leading-none"
            style={headingStyle}
          >
            {title}
          </h2>
          {badge}
        </div>
        {subtitle && (
          <p className="text-[13px] text-text-tertiary m-0 mt-0.5 font-normal">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default SectionHeading;
