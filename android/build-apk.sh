#!/usr/bin/env bash
# Builds CustomMood.apk with the Android SDK tools only (no Gradle needed).
set -euo pipefail
SDK=${ANDROID_HOME:-/opt/android-sdk}; BT=$SDK/build-tools/35.0.0; JAR=$SDK/platforms/android-34/android.jar
OUT=build-manual; rm -rf $OUT; mkdir -p $OUT/res $OUT/classes $OUT/gen
sed 's|<manifest xmlns:android="http://schemas.android.com/apk/res/android">|<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="app.custommood">|' app/src/main/AndroidManifest.xml > $OUT/AndroidManifest.xml
$BT/aapt2 compile --dir app/src/main/res -o $OUT/res.zip
$BT/aapt2 link -o $OUT/base.apk -I $JAR --manifest $OUT/AndroidManifest.xml -A app/src/main/assets \
  --min-sdk-version 24 --target-sdk-version 34 --version-code 1 --version-name 1.0 --java $OUT/gen --no-compress-regex '\.png$' $OUT/res.zip
javac -nowarn -source 8 -target 8 -g:none -classpath $JAR -d $OUT/classes $(find app/src/main/java $OUT/gen -name '*.java') 2>&1 | grep -v 'bootstrap\|warning' || true
$BT/d8 --min-api 24 --lib $JAR --output $OUT $(find $OUT/classes -name '*.class')
cp $OUT/base.apk $OUT/unsigned.apk && (cd $OUT && zip -q unsigned.apk classes.dex)
$BT/zipalign -f -p 4 $OUT/unsigned.apk $OUT/aligned.apk
KS=$OUT/../custommood.keystore
[ -f "$KS" ] || keytool -genkeypair -keystore "$KS" -alias custommood -keyalg RSA -keysize 2048 -validity 10000 -storepass custommood -keypass custommood -dname "CN=Custom Mood" >/dev/null 2>&1
$BT/apksigner sign --ks "$KS" --ks-pass pass:custommood --key-pass pass:custommood --out CustomMood.apk $OUT/aligned.apk
$BT/apksigner verify CustomMood.apk && echo "Built CustomMood.apk"
