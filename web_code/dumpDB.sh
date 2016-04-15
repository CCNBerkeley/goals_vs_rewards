#!/bin/sh

if [ $# -ne 1 ];
then
   echo 'You need to provide exactly one argument, a table name.'
   exit 1
fi

# This script requires you to name the table to dump.
# I.e. for the demo table, call 'dumpDB.sh turkdemo'
echo ".mode column\n.headers on\nselect * from ${1};\n" | sqlite3 participants.db > dumpDB.out
