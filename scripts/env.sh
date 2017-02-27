#!/bin/bash

export envfile
export admin

envfile="$(pwd)/.env"
if test "admin" = "$1"; then
	echo "Performing admin configuration too"
	admin="yes"
else
	echo "Skipping remove configuration"
	admin="no"
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

function addToHeroku {
	local key="$1"
	local val="${!key}"
	echo "Adding $key to heroku"
	heroku config:set "$key=$val" || exit -1
}

function handle {
	check $1
	addToEnvFile $1 $envfile
	if test "yes" = "$admin"; then
		addToTravis $1
		addToHeroku $1
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
