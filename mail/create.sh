#!/bin/bash

# Generate the hash
PWD='grossberg'
APWD='Gro$$berg1973'

SERGEY=$(docker run --rm -e PASSWORD="$PWD" mailserver/docker-mailserver:15.1.0 /bin/bash -c "doveadm pw -s SHA512-CRYPT -p '$PASSWORD'")
NIKITA=$(docker run --rm -e PASSWORD="$PWD" mailserver/docker-mailserver:15.1.0 /bin/bash -c "doveadm pw -s SHA512-CRYPT -p '$PASSWORD'")
ADMIN=$(docker run --rm -e PASSWORD="$APWD" mailserver/docker-mailserver:15.1.0 /bin/bash -c "doveadm pw -s SHA512-CRYPT -p '$PASSWORD'")

# Create the file
echo "sergey@semantec.lan|${SERGEY}"  > ./mail/accounts.cf
echo "nikita@semantec.lan|${NIKITA}" >> ./mail/accounts.cf
echo "admin@semantec.lan|${ADMIN}" >> ./mail/accounts.cf

echo "postmaster@semantec.lan admin@semantec.lan" > ./mail/virtual.cf

chmod 644 ./mail/accounts.cf
chmod 644 ./mail/virtual.cf
