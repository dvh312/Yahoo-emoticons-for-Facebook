here="`dirname \"$0\"`"
echo "cd-ing to $here"
cd "`dirname \"$0\"`" || exit 1

mkdir Packed
cp -r ../images ./Packed/images/
cp -r ../js ./Packed/js/
cp ../manifest.json ./Packed/manifest.json

echo "Creating zip file..."
zip -r Packed.zip ./Packed/

echo ""
echo "Cleaning up..."
rm -r ./Packed/
exit 0
