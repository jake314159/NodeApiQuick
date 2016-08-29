
# exit on fail
set -e 
set -o pipefail

files=(test/*.js)

for item in ${files[*]}
do
  mocha $item
done