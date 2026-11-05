#!/bin/bash
out=$1; cols=$2; shift 2
n=$#; args=(); filt=""; i=0
for f in "$@"; do args+=(-i "$f"); filt+="[$i:v]scale=360:-1[v$i];"; i=$((i+1)); done
inputs=""; for ((k=0;k<n;k++)); do inputs+="[v$k]"; done
ffmpeg -v error -y "${args[@]}" -filter_complex "${filt}${inputs}xstack=inputs=$n:layout=$(for ((k=0;k<n;k++)); do c=$((k%cols)); r=$((k/cols)); printf "%d_%d|" $((c*360)) $((r*640)); done | sed 's/|$//')" "$out"
