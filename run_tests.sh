
# exit on fail
set -e 
set -o pipefail

files=(test/*)

echo ${files[*]}

for item in ${files[*]}
do
  mocha $item
done