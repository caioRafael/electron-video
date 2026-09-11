# Third-party notices for bundled FFmpeg / FFprobe

## FFmpeg

Project: FFmpeg
License: GNU Lesser General Public License v2.1 or later, or LGPLv3 for the
BtbN `lgpl` builds that pass `--enable-version3`
Source: https://ffmpeg.org/
License texts in this directory:

- `LICENSE.md`
- `COPYING.LGPLv2.1`
- `COPYING.LGPLv3`

## macOS binaries

Compiled from the official FFmpeg `n8.1` source without extra third-party
codec libraries. Native FFmpeg demuxers and decoders are included. No
libx264, libx265, fdk-aac, or other GPL/nonfree components are enabled.

## Windows and Linux binaries

Provider: BtbN/FFmpeg-Builds
Variant: `lgpl`
Release channel: `latest` n8.1
Source and build scripts: https://github.com/BtbN/FFmpeg-Builds

These builds omit GPL-only libraries, most prominently libx264 and libx265.
They also omit nonfree components such as fdk-aac.

The extracted vendor license files, when present, are copied to:

```text
licenses/ffmpeg/vendor/<platform>/
```

Consult those files for the exact third-party notices shipped with a given
BtbN package.
