import SectionHeading from "./SectionHeading";
import { memo } from "react";
import ScrollableRow from "@/shared/ui/ScrollableRow";
import { useTranslation } from "@/languages";
import type { DailyMix } from "../hooks/useDailyMixes";
import DailyMixCard from "./DailyMixCard";
import MixFluidSquare from "./MixFluidSquare";

export interface DailyMixesSectionProps {
  mixes: DailyMix[];
  headingMarginTop?: string;
}


const headingStyle: React.CSSProperties = {
  fontFamily: "var(--font-roboto-flex), sans-serif",
  fontWeight: 564,
  fontVariationSettings:
    "'wght' 564, 'GRAD' 105, 'XOPQ' 100, 'wdth' 134, 'opsz' 144",
};

function DailyMixesSection({
  mixes,
  headingMarginTop = "mt-[22px]",
}: DailyMixesSectionProps) {
  const { t } = useTranslation();
  if (mixes.length === 0) return null;

  void MixFluidSquare;
  void headingStyle;

  return (
    <div className="flex flex-col">
      <SectionHeading
        title={t("home.dailyMixes") || "Your Mixes"}
        subtitle="Mixes from your account"
        marginTop={headingMarginTop}
      />

      <ScrollableRow className="flex gap-[22px] pl-4 pr-3 mt-[14px] overflow-x-auto pb-[2px]">
        {mixes.map((mix, index) => (
          <DailyMixCard
            key={`daily-mix-${mix.id}-${index}`}
            mix={mix}
            index={index}
          />
        ))}
      </ScrollableRow>
    </div>
  );
}

export default memo(DailyMixesSection);
