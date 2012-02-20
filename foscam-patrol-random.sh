#!/bin/bash

# Used in logging
CAMNAME=Livingroom
# URL to the foscam
CAMURL=http://foobar.com:8123/decoder_control.cgi?command=
# User name with operator access
UNAME=camuser
# Password
PWD=mypass
# Lowest preset value to use
MINPRESET=1
# Highest preset value to use
MAXPRESET=8
# Big Jump is a large move will add BIGJUMPDELAY to the DELAYBETWEENMOVES below
BIGJUMP=4
# Standard delay between move commands
DELAYBETWEENMOVES=18
# Amount of dealy to ADD if it is a BIGJUMP move
BIGJUMPDELAY=6


FLOOR=$(( $MINPRESET - 1 ))
RANGE=$(( $MAXPRESET + 1 ))
lastCam=0
while [ 1 ]
do
        number=0   #initialize
        while [ "$number" -le $FLOOR ]
        do
                number=$RANDOM
                let "number %= $RANGE"  # Scales $number down within $RANGE.
        done
	echo "$(date -R) - $CAMNAME - Previous Camera position: $lastCam"
        echo "$(date -R) - $CAMNAME - Random camera position selection:  $number"
	camDiff=$(( $lastCam - $number ))
	if [ $camDiff -lt 0 ]
		then
			camDiff=$(( $camDiff * -1 ))
	fi
	echo "$(date -R) - $CAMNAME - Moving $camDiff stations..."
	sleepVal=$DELAYBETWEENMOVES
	if [ $camDiff -gt $BIGJUMP ] 
		then
			sleepVal=$(( $sleepVal + $BIGJUMPDELAY ))
	fi
	if [ $camDiff -ne 0 ]
		then
        		value=$((( ( $number - 1 ) * 2 ) + 31))
        		curl -s --user $UNAME:$PWD $CAMURL$value >> /dev/null
			echo "$(date -R) - $CAMNAME - Sleeping for $sleepVal ..."
        		lastCam=$number
			sleep $sleepVal
	fi
	if [ $camDiff -eq 0 ]
		then
			echo "$(date -R) - $CAMNAME - Same camera selected... continue..."
			lastCam=$number
			sleep 1
	fi
done
