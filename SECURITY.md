# Security Policy

PlagTrace runs entirely in the visitor's browser and processes files the
visitor chooses locally. It does not upload, store, or transmit documents.

## Reporting a vulnerability

Do not open a public issue for a security problem. Contact the repository
maintainer privately (via the contact listed on the repository profile) with
a minimal reproduction. File-parser issues in `src/files.js` (.docx ZIP
parsing, PDF stream handling) are in scope, as is any DOM injection via
highlighted text — highlighting in `src/app.js` escapes all document text
before inserting it, and that invariant must be preserved.

## Supported versions

Only the latest release on the `main` branch is supported.
