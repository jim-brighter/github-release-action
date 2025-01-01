#!/usr/bin/env bash

git fetch -pP
gh release create $1 --generate-notes
git fetch -pP
git tag -f $2 $1
git push -f --tags
