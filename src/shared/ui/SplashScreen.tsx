import SparkMark from "./SparkMark";

export interface SplashScreenProps {
  /** small caption under the progress bar (omit for a pure logo screen) */
  label?: string;
}

/**
 * Full-window loading screen: the animated Spark sparkle, wordmark and an
 * indeterminate progress line. Matches the static boot splash in index.html so
 * the hand-off from "page loaded" to "app initializing" has no visible jump.
 */
export function SplashScreen({ label }: SplashScreenProps) {
  return (
    <div
      className="spark-splash"
      role="status"
      aria-live="polite"
      aria-label={label || "Spark"}
    >
      <div className="spark-splash__glow" aria-hidden="true" />
      <div className="spark-splash__center">
        <SparkMark size={104} animated />
        <div className="spark-splash__word">Spark</div>
      </div>
      <div className="spark-splash__bar" aria-hidden="true">
        <span />
      </div>
      {label ? <div className="spark-splash__label">{label}</div> : null}
    </div>
  );
}

export default SplashScreen;
