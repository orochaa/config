# Smell baseline

The Standards review applies this Fowler smell baseline alongside the guidance
set. Precedence:

- A documented repository standard overrides the baseline.
- Every smell is a judgement call, not a hard violation.
- Tooling-enforced rules are out of scope.

## Smells

- **Mysterious Name** — a name does not reveal what it does or holds. → Rename
  it; if no honest name comes, the design is murky.
- **Duplicated Code** — the same logic shape appears in more than one changed
  hunk or file. → Extract the shared shape and call it from both sites.
- **Feature Envy** — a method reaches into another object's data more than its
  own. → Move it onto the data it envies.
- **Data Clumps** — the same fields or parameters travel together. → Bundle them
  into one type and pass that.
- **Primitive Obsession** — a primitive represents a domain concept deserving
  its own type. → Give that concept a small type.
- **Repeated Switches** — the same `switch` or `if` cascade on one type recurs.
  → Use polymorphism or one shared map.
- **Shotgun Surgery** — one logical change forces scattered edits. → Gather what
  changes together into one module.
- **Divergent Change** — one module changes for several unrelated reasons. →
  Split it so each module changes for one reason.
- **Speculative Generality** — an abstraction, parameter, or hook has no
  specification need. → Delete it or inline it until a real need exists.
- **Message Chains** — long `a.b().c().d()` navigation exposes an internal walk.
  → Hide it behind one method on the first object.
- **Middle Man** — a class or function mostly delegates onward. → Remove it and
  call the real target directly.
- **Refused Bequest** — a subclass or implementer ignores most inherited
  behavior. → Prefer composition over that inheritance.
