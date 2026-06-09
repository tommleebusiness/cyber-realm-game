#!/usr/bin/env bash
set -e

BUILD_DIR="/c/Users/Komp/.openclaw/workspace/cyber-realm-game/android-build"
SDK="/c/Users/Komp/android-sdk"
BUILD_TOOLS="$SDK/build-tools/34.0.0"
PLATFORM="$SDK/platforms/android-34/android.jar"
JAVA="java"
JAVAC="javac"

echo "=== Cyber Realm Idle APK Builder ==="

# Clean build
rm -rf build
mkdir -p build/abi build/dex build/gen build/obj build/res-compiled build/final

echo "[1/7] Compiling resources..."
$BUILD_TOOLS/aapt2 compile --dir "$BUILD_DIR/res" -o build/res-compiled/compiled.zip

echo "[2/7] Linking APK..."
$BUILD_TOOLS/aapt2 link \
    -o build/linked.apk \
    -I "$PLATFORM" \
    --manifest "$BUILD_DIR/AndroidManifest.xml" \
    --java build/gen \
    build/res-compiled/compiled.zip 2>&1 | grep -v "warn:" || true

echo "[3/7] Compiling Java..."
mkdir -p build/obj
$JAVAC -source 1.8 -target 1.8 \
    -cp "$PLATFORM" \
    -d build/obj \
    "$BUILD_DIR/gen/com/cyberrealm/idle/R.java" \
    "$BUILD_DIR/src/com/cyberrealm/idle/MainActivity.java" 2>&1 | grep -v "^warning:" || true

echo "[4/7] Converting to DEX..."
mkdir -p build/dex
$BUILD_TOOLS/d8 \
    --min-api 21 \
    --output build/dex/ \
    build/obj/com/cyberrealm/idle/*.class 2>&1 || true

echo "[5/7] Creating APK..."
# Unzip linked APK
cd build/final
rm -rf apk_content
mkdir apk_content
unzip -o ../linked.apk -d apk_content/ > /dev/null

# Add DEX
mkdir -p apk_content/classes.dex 2>/dev/null || true
cp ../dex/classes.dex apk_content/ 2>/dev/null || echo "WARNING: No classes.dex"

# Add assets
mkdir -p apk_content/assets
cp ../../../index.html assets/
cp ../../../manifest.json assets/
cp ../../../sw.js assets/
cp ../../../store-assets/icon-192.png assets/
cp ../../../store-assets/icon-512.png assets/
cp -r assets apk_content/

# Repackage
rm -rf newapk.zip
cd apk_content
zip -r ../newapk.zip * > /dev/null
cd ..

# Move to zipalign location
cp newapk.zip ../unaligned.apk
cd ../..

echo "[6/7] Zipalign..."
$BUILD_TOOLS/zipalign -f 4 build/unaligned.apk build/final.apk

echo "[7/7] Signing..."
$BUILD_TOOLS/apksigner sign \
    --ks "$BUILD_DIR/cyber-realm.keystore" \
    --ks-key-alias cyberrealm \
    --ks-pass pass:cyberrealm2026 \
    --key-pass pass:cyberrealm2026 \
    --out "$BUILD_DIR/CyberRealm-v9.5.apk" \
    build/final.apk

echo ""
echo "=== DONE ==="
ls -la "$BUILD_DIR/CyberRealm-v9.5.apk"
echo ""
echo "Verifying..."
$BUILD_TOOLS/apksigner verify --print-certs "$BUILD_DIR/CyberRealm-v9.5.apk" 2>&1 | grep -E "Verified|Signer"
