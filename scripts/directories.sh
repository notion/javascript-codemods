# generate list of directories for transformer

# command line arguments
ROOT_DIRECTORY=$1

# search from the root directory
# for directories at depth 1
# for each 1 line of output
# strip directory from the name
# and put output into variable
output=$(find $ROOT_DIRECTORY -type d -depth 1 | xargs -L 1 basename)

# create array
list=($output)

# convert list of directories into string with array behind each item except last item
index=0
length=${#list[@]}
lengthMinusOne=$((length-1))

for item in "${list[@]}"
do
  if [ $lengthMinusOne -eq $index ]
  then
    str=${str}${item}
  else
    str=${str}${item},
  fi

  let index=$index+1
done

echo $str
