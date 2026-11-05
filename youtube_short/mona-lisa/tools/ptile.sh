#!/bin/bash
# ptile.sh out.png cols files... : crop the story window of each still and tile them (540 wide each)
out=$1; cols=$2; shift 2
n=$#; args=(); filt=""; i=0
for f in "$@"; do args+=(-i "$f"); filt+="[$i:v]crop=1080:620:0:600,scale=540:-1,drawtext=text='${f#s_}':x=8:y=8:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.6[v$i];"; i=$((i+1)); done
inputs=""; for ((k=0;k<n;k++)); do inputs+="[v$k]"; done
ffmpeg -v error -y "${args[@]}" -filter_complex "${filt}${inputs}xstack=inputs=$n:layout=$(for ((k=0;k<n;k++)); do c=$((k%cols)); r=$((k/cols)); printf "%d_%d|" $((c*540)) $((r*310)); done | sed 's/|$//')" "$out"
