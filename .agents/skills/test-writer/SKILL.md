---
name: test-writer
description: Use whenever you need to write a unit, integration or component test.
---

# Test Writer

See tests.md for examples and mocking.md for mocking guidelines.

## Core principle

Tests should verify behavior through public interfaces, not implementation details.
Code can change entirely; tests shouldn't.

## Good tests

They are integration-style; they exercise real code paths through public APIs.
They describe what the system does, not how it does it.
A good test reads like a specification - "user can checkout with valid cart" 
tells you exactly what capability exists.
These tests survive refactors because they don't care about internal structure.

## Bad tests

They are coupled to implementation. 
They mock internal collaborators, test private methods, or verify through 
external means (like querying a database directly instead of using the interface). 
The warning sign: your test breaks when you refactor, but behavior hasn't changed. 
If you rename an internal function and tests fail, 
those tests were testing implementation, not behavior.
