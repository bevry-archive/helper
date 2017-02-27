#!/bin/bash

export envfile
export travis

envfile="$(pwd)/.env"
if test "travis" = "$1"; then
	echo "Performing travis configuration too"
	travis="yes"
else
	echo "Skipping travis configuration"
	travis="no"
fi

function check {
	local key="$1"
	local val="${!key}"
	echo "ENV $key=$val"
	if test -z "$val"; then
		echo "!MISSING! $key"
		exit -1
	fi
}

function addToEnvFile {
	local key="$1"
	local val="${!key}"
	echo "Adding $key to $2"
	echo "$key=$val" >> "$2"
}

function addToTravis {
	local key="$1"
	local val="${!key}"
	echo "Adding $key to travis"
	travis env set "$key" "$val" --no-interactive || exit -1
}

function handle {
	check $1
	addToEnvFile $1 $envfile
	if test "yes" = "$travis"; then
		addToTravis $1
	fi
	echo -e ""
}

echo "Configuring environment variables..."
handle BEVRY_CM_KEY
handle BEVRY_DATABASE_URL
handle BEVRY_TWITTER_CONSUMER_KEY
handle BEVRY_TWITTER_CONSUMER_SECRET
handle TWITTER_ACCESS_TOKEN
handle TWITTER_ACCESS_TOKEN_SECRET
handle DP_CM_LIST_ID
handle DP_SEGMENT_KEY
handle SH_CM_LIST_ID
handle SH_API_KEY
handle NOW_TOKEN
echo "All done successfully"
