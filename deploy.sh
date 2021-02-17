## Now I use this simple script to increamentally update a hugo site on s3 bucket. It is a whole lot faster and take less bandwidth ;)
## Note that the change base on size of the file, not hash because it's quicker to just get the size :p

#!/bin/bash
set -e

function finish {
    echo "[+] Exit code clean up .sitedeploy.tmp and .newfiles.tmp"
    rm .sitedeploy.tmp
    rm .newfiles.tmp
}
trap finish EXIT


# Generate public folder
hugo

BUCKET=$BLOGBUCKET
AWS_PROFILE=san-study

## Run ./deploy.sh rebuild to rebuild the entire site(if you want to overwrite existing files)
if [ "$1" = "rebuild" ]; then
  aws s3 cp ./public/ s3://$BUCKET/ --recursive
  exit
fi

aws s3 sync --delete ./public s3://$BLOGBUCKET
exit

## Below is previous deployment script when I did know know about s3 sync command :-/
## If rebuild argument is not added, we just look for any new page to update them.
## Note that existing pages won't be updated.

echo "[+] Get the current list of files and its size"
aws s3 ls --recursive s3://$BUCKET/ > .sitedeploy.tmp
find ./public -type f | sed 's/\.\/public\///g' > .newfiles.tmp
# newfiles=$(find ./public -type f | sed 's/\.\/public\///g')
echo "[+] Get the new file list and comparing size"
while IFS= read -r line ; do 
    # echo "$line";
    currentsize=$(grep " $line$" .sitedeploy.tmp | awk '{ print $3 }');
    # echo $currentsize;
    newsize=$(ls -lart ./public/$line | awk '{ print $5 }');
    if [ "$newsize" != "$currentsize" ]; then
        echo "Updating $line"
        aws s3 cp ./public/$line s3://$BUCKET/$line
    fi 
done < .newfiles.tmp


echo "[+] Deleting files that does not exist locally"

while IFS= read -r line ; do 
    currentfile=$(echo "$line" | awk '{ print $4 }')
    # If the old file does not exist in our new list - delete it
    if ! grep -Fxq "$currentfile" .newfiles.tmp ; then
        echo "Deleting $currentfile";
        aws s3 rm s3://$BUCKET/$currentfile
    fi 
done < .sitedeploy.tmp
