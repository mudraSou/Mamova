# BDD Test Cases — Postpartum Guide

Written in Gherkin (Given/When/Then). Framework-agnostic.
Implement with Playwright + Cucumber.js when migrating to Next.js in Phase 1.

## Structure

```
tests/
  bdd/
    phase1-symptoms.feature       Symptom list, detail, severity, bookmarks
    phase1-positions.feature      Position list, detail, checklist, mistakes
    phase1-auth-navigation.feature Auth, onboarding, home, nav, dark mode, offline
    phase2-triage.feature         Triage agent routing, fallback, error handling
    phase3-safety-gate.feature    Red flag detection, escalation cards, Claude not called
    phase3-coach.feature          Chat UI, coach flow, retrieval, save-tip, rate limiting
```

## Phase gates

| Phase | Gate condition before shipping             |
|-------|--------------------------------------------|
| 1     | All phase1-*.feature scenarios pass        |
| 2     | All phase2-*.feature scenarios pass        |
| 3     | ALL phase3-safety-gate.feature must pass   |
|       | Then phase3-coach.feature scenarios pass   |

Phase 3 safety gate is a hard block. Coach features do not ship
until every scenario in phase3-safety-gate.feature passes.

## Recommended implementation stack

- **Test runner:** Playwright (browser automation)
- **BDD layer:** @cucumber/cucumber (step definitions)
- **API mocking:** Playwright route interception
- **Assertions:** Playwright expect()

## Quick start (Phase 1, after Next.js migration)

```bash
npm install -D @playwright/test @cucumber/cucumber
npx playwright install chromium
npx cucumber-js tests/bdd/phase1-*.feature
```
