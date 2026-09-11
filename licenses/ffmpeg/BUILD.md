# FFmpeg / FFprobe build information

Pinned FFmpeg version: `n8.1`

The application never depends on a user-installed FFmpeg. Binaries are prepared by:

```text
pnpm prepare:ffmpeg
```

## macOS (darwin-arm64, darwin-x64)

Source: official FFmpeg `n8.1`

https://github.com/FFmpeg/FFmpeg/archive/refs/tags/n8.1.tar.gz

Configure:

```text
./configure
  --enable-static
  --disable-shared
  --disable-debug
  --disable-doc
  --disable-ffplay
  --enable-ffmpeg
  --enable-ffprobe
```

License: LGPLv2.1+

Not enabled:

```text
--enable-gpl
--enable-nonfree
```

## Windows and Linux

Source: BtbN FFmpeg-Builds `lgpl` variant of FFmpeg `n8.1`

https://github.com/BtbN/FFmpeg-Builds

Known configure from `variants/defaults-lgpl.sh`:

```text
--enable-version3 --disable-debug
```

License file used by that variant: `COPYING.LGPLv3`

Not enabled:

```text
--enable-gpl
--enable-nonfree
```

`--enable-version3` upgrades FFmpeg from LGPLv2.1 to LGPLv3 so Apache 2.0
libraries can be included. It does not enable GPL-only components such as
libx264 or libx265.

## Verification

After preparing binaries, the prepare script runs `ffmpeg -version` and
`ffprobe -version` on the current platform and rejects any configuration
that contains `--enable-gpl` or `--enable-nonfree`.

```text
pnpm verify:media
```
