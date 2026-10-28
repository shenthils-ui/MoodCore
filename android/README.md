# Optional Android wrapper

The phone web app (see the main README) is the normal way to install Custom Mood.
This folder wraps the same `index.html` in a native Android app, for when an .apk file is wanted.

Build with the Android SDK command-line tools (build-tools 35, platform 34):

    python3 ../build.py          # refresh app/src/main/assets/index.html
    ANDROID_HOME=/path/to/sdk ./build-apk.sh

The script creates `CustomMood.apk` and a local signing key `custommood.keystore`.
Keep that key: updates must be signed with the same key. It is excluded from git.

Android Studio also works: open this folder and use Build > Build APK(s).
