# Workstation Configuration

This context describes the personal workstation configuration managed by
this repository. Its current target is Fedora KDE; portability beyond that
target is unverified.

## Language

**Bootstrap**:
The first-time application of this repository's workstation setup to a
machine.
_Avoid_: Install

**Module**:
A named part of the workstation configuration that can be applied and
maintained independently.
_Avoid_: Component

**Install**:
Applying a module's managed configuration to a workstation.
_Avoid_: Bootstrap

**Update**:
Capturing the workstation's current managed configuration into the repository.
_Avoid_: Install

**Sync**:
Bringing the repository's configuration up to date from a workstation and
publishing the resulting changes.
_Avoid_: Update
