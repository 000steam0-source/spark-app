// "Continue without an account": lets people use Spark signed out.
const KEY = "spark_guest_mode";

export function isGuestMode(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setGuestMode(on: boolean) {
  try {
    if (on) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event("spark:guest-changed"));
}
