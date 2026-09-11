# Bundled FFmpeg / FFprobe

This directory stores platform-specific FFmpeg and FFprobe binaries prepared by:

```text
pnpm prepare:ffmpeg
```

The binaries are downloaded or compiled during install/build. They are not committed to Git.

```text
resources/ffmpeg/
├── darwin-arm64/
│   ├── ffmpeg
│   └── ffprobe
├── darwin-x64/
├── win32-x64/
└── linux-x64/
```

The application never uses `ffmpeg` or `ffprobe` from the system `PATH`.
