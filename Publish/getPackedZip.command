here="`dirname \"$0\"`"
echo "cd-ing to $here"
cd "`dirname \"$0\"`" || exit 1

mkdir Packed
cp -r ../images ./Packed/images/
cp -r ../js ./Packed/js/
cp ../manifest.json ./Packed/manifest.json
for file in ./Packed/js/*.js; do
	if [ -f "$file" ]; then
		echo ""
		echo "Obfuscating...    "$file
		java -jar compiler.jar --js $file --js_output_file ${file%.*}-min.js --warning_level VERBOSE --compilation_level ADVANCED --externs ./chrome_extensions.js
		mv ${file%.*}-min.js $file
	fi
done
echo ""
echo "Creating zip file..."
zip -r Packed.zip ./Packed/

echo ""
echo "Cleaning up..."
rm -r ./Packed/
exit 0
