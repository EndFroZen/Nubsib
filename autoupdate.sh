#!/bin/bash

VERSION_FILE="VERSION"

if [ ! -f "$VERSION_FILE" ]; then
  echo "0.1.0" > "$VERSION_FILE"
fi

VERSION=$(cat "$VERSION_FILE")
IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION"

echo "เลือกประเภท commit:"
echo "1) feat  (เพิ่ม feature)"
echo "2) fix   (แก้ bug)"
read -p "เลือก (1/2): " CHOICE

TIME=$(date "+%Y-%m-%d %H:%M:%S")

case "$CHOICE" in
  1)
    MINOR=$((MINOR + 1))
    PATCH=0
    TYPE="feat"
    ;;
  2)
    PATCH=$((PATCH + 1))
    TYPE="fix"
    ;;
  *)
    echo "❌ เลือกไม่ถูกต้อง"
    exit 1
    ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo "$NEW_VERSION" > "$VERSION_FILE"

git add .
git commit -m "$TYPE: version $NEW_VERSION ($TIME)"

echo "✅ Commit เรียบร้อย:"
echo "   $TYPE: version $NEW_VERSION ($TIME)"
