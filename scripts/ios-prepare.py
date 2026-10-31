"""Applies Spark branding and settings to the generated Capacitor iOS project."""
import plistlib, re, shutil, sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
app = root / "ios" / "App" / "App"
res = root / "mobile" / "ios-res"

icon_dir = app / "Assets.xcassets" / "AppIcon.appiconset"
for png in icon_dir.glob("*.png"):
    shutil.copy(res / "AppIcon-512@2x.png", png)
splash_dir = app / "Assets.xcassets" / "Splash.imageset"
for png in splash_dir.glob("*.png"):
    shutil.copy(res / "splash.png", png)

plist_path = app / "Info.plist"
with open(plist_path, "rb") as f:
    info = plistlib.load(f)
info["CFBundleDisplayName"] = "Spark"
modes = set(info.get("UIBackgroundModes", []))
modes.add("audio")
info["UIBackgroundModes"] = sorted(modes)
info["UIStatusBarStyle"] = "UIStatusBarStyleLightContent"
info["UIViewControllerBasedStatusBarAppearance"] = False
info["ITSAppUsesNonExemptEncryption"] = False
with open(plist_path, "wb") as f:
    plistlib.dump(info, f)

delegate = app / "AppDelegate.swift"
code = delegate.read_text()
if "AVAudioSession" not in code:
    code = code.replace("import UIKit", "import UIKit\nimport AVFoundation", 1)
    hook = "didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {"
    if hook not in code:
        sys.exit("AppDelegate layout changed - cannot add the audio session")
    code = code.replace(
        hook,
        hook
        + "\n        // keep music playing with the screen locked or the app in the background"
        + "\n        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)"
        + "\n        try? AVAudioSession.sharedInstance().setActive(true)",
        1,
    )
    delegate.write_text(code)
print("iOS project prepared")
