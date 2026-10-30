# Future Flask/SQLite backend placeholder

No backend or database is implemented in this BookBeacon frontend phase. This directory exists only to mark the planned integration boundary.

A separate server implementation may use Python Flask with SQLite, but it must follow the proposed REST contracts in the root [README](../README.md), return the documented JSON success/error shapes, validate all requests, authenticate users, enforce student/librarian permissions server-side, and maintain transactional consistency for physical copies and active loans. It should provide migrations/schema, authorization, unique Book ID/QR constraints, event/audit records, institutional due-date/fine policy, and deployment/security configuration before production use.

Do not treat the browser's mock services, localStorage, QR lookup, demo role guards, mismatch flags, or audit progress as backend validation or physical shelf evidence. No Python dependencies, API route handlers, SQLite file, credentials, or production services are included here.
