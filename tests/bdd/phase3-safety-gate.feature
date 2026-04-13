# ============================================================
# PHASE 3 — SAFETY GATE (Non-negotiable before launch)
# Covers: red flag pattern detection, escalation card rendering,
#         category classification, Claude never called on red flags,
#         edge cases, mental health crisis, baby emergencies
#
# RULE: Every test in this file must pass before /chat goes live.
#       No exceptions. No deferrals.
# ============================================================

Feature: Safety Gate — Red Flag Detection

  Background:
    Given window.Safety is loaded from safety.js
    And the escalation_card.json is loaded

  # ── Infection / Mastitis ────────────────────────────────────

  Scenario Outline: Fever-related inputs trigger the safety gate
    When I call isSafeToCoach("<input>")
    Then it should return false

    Examples:
      | input                                              |
      | I have a fever                                     |
      | my temperature is 38°C                             |
      | I feel feverish and my breast hurts                |
      | I have chills and my breast is hard                |
      | high temp since this morning                       |

  Scenario Outline: Breast infection signs trigger the safety gate
    When I call isSafeToCoach("<input>")
    Then it should return false

    Examples:
      | input                                                        |
      | there are red streaks on my breast                           |
      | I can see red streaks spreading                              |
      | there is pus coming from my nipple                           |
      | my breast is hot to touch and red                            |
      | I think I have mastitis                                      |
      | I have an abscess in my breast                               |
      | my breast is infected                                        |
      | my breast feels inflamed and warm to touch                   |

  Scenario: Mastitis keyword alone triggers the gate
    When I call isSafeToCoach("could this be mastitis?")
    Then it should return false

  # ── Bleeding ───────────────────────────────────────────────

  Scenario Outline: Bleeding-related inputs trigger the safety gate
    When I call isSafeToCoach("<input>")
    Then it should return false

    Examples:
      | input                                              |
      | my nipples are cracked and bleeding                |
      | cracked nipple that won't stop bleeding            |
      | bleeding from my nipple every feed                 |
      | there is blood in my breast milk                   |
      | my c-section wound is bleeding again               |
      | the wound has opened                               |

  # ── Mental Health Crisis ───────────────────────────────────

  Scenario Outline: Mental health crisis inputs trigger the safety gate
    When I call isSafeToCoach("<input>")
    Then it should return false

    Examples:
      | input                                                   |
      | I want to hurt myself                                   |
      | I want to harm my baby                                  |
      | I don't want to live                                    |
      | I'm having thoughts of killing myself                   |
      | I'm suicidal                                            |
      | suicidal thoughts keep coming                           |
      | I've been thinking of harming him                       |

  # ── Baby Emergency ─────────────────────────────────────────

  Scenario Outline: Baby emergency inputs trigger the safety gate
    When I call isSafeToCoach("<input>")
    Then it should return false

    Examples:
      | input                                                  |
      | my baby won't wake up                                  |
      | I can't wake my baby                                   |
      | baby is limp and unresponsive                          |
      | baby is turning blue                                   |
      | baby is not breathing properly                         |
      | baby looks floppy                                      |

  # ── Breathing / Cardiac ───────────────────────────────────

  Scenario Outline: Maternal breathing or cardiac inputs trigger the gate
    When I call isSafeToCoach("<input>")
    Then it should return false

    Examples:
      | input                                |
      | I can't breathe properly             |
      | shortness of breath                  |
      | I have chest pain                    |
      | my heart is racing                   |
      | heart pounding constantly            |

  # ── Safe Inputs — Gate Must NOT Trigger ───────────────────

  Scenario Outline: Normal breastfeeding questions are safe to coach
    When I call isSafeToCoach("<input>")
    Then it should return true

    Examples:
      | input                                                              |
      | my baby keeps slipping off during feeds                            |
      | how do I know if my baby is getting enough milk                    |
      | is cluster feeding normal on day 5                                 |
      | which position is best for large breasts                           |
      | how long should each feed last                                     |
      | my nipples are sore after feeding                                  |
      | baby seems gassy after feeds                                       |
      | how do I increase my milk supply naturally                         |
      | should I wake my baby to feed at night                             |
      | what does a good latch look like                                   |

  Scenario: Case insensitivity — uppercase input still triggers the gate
    When I call isSafeToCoach("I HAVE A FEVER AND RED STREAKS")
    Then it should return false

  Scenario: Mixed case input triggers the gate
    When I call isSafeToCoach("My Breast Is Hot And I Have A Fever")
    Then it should return false

  Scenario: Empty string is considered safe
    When I call isSafeToCoach("")
    Then it should return true

  Scenario: Null input is handled safely
    When I call isSafeToCoach(null)
    Then it should return true and not throw an error

  Scenario: Non-string input is handled safely
    When I call isSafeToCoach(12345)
    Then it should return true and not throw an error


Rule: Safety Gate — Escalation Card Classification

  Scenario Outline: Red flag inputs are classified into the correct escalation category
    When I call classifyEscalationCategory("<input>")
    Then it should return "<category>"

    Examples:
      | input                                          | category       |
      | I have a fever and red streaks                 | infection      |
      | mastitis symptoms                              | infection      |
      | my nipple is bleeding                          | bleeding       |
      | wound has opened                               | bleeding       |
      | I want to harm myself                          | mental_health  |
      | suicidal thoughts                              | mental_health  |
      | baby is limp and not waking                    | baby_emergency |
      | baby is turning blue                           | baby_emergency |
      | I can't breathe                                | default        |
      | chest pain                                     | default        |

  Scenario: Mental health category is checked before infection category
    Given an input matches both mental_health and infection patterns
    When classifyEscalationCategory is called
    Then it should return "mental_health"
    And mental health category should always take priority


Rule: Safety Gate — Escalation Card Rendering

  Scenario: Infection escalation card shows the correct content
    Given I submit "I have a fever and red streaks on my breast" in the chat
    When the safety gate triggers
    Then I should see the escalation card with title "This needs medical attention today"
    And I should see at least 2 actions
    And the first action should mention calling a doctor or midwife
    And I should see the reassurance message about continuing breastfeeding
    And I should see the disclaimer text

  Scenario: Mental health escalation card shows crisis line information
    Given I submit "I want to hurt myself" in the chat
    When the safety gate triggers
    Then I should see the escalation card with title "Please reach out right now"
    And I should see at least one crisis line number
    And the card should have the error-colour left border

  Scenario: Baby emergency escalation card shows emergency services instruction
    Given I submit "my baby won't wake up" in the chat
    When the safety gate triggers
    Then I should see the escalation card for baby emergency
    And the first action should instruct the user to call emergency services immediately
    And there should be NO reassurance text (this is an immediate emergency)

  Scenario: Escalation card is always rendered from JSON — never from Claude
    Given any red flag input is submitted
    When the safety gate triggers
    Then the Claude API ("/api/chat") should NOT be called
    And the escalation content should come from escalation_card.json only
    And the response should appear within 300ms (no API latency)

  Scenario: Escalation card has role="alert" for screen readers
    Given a red flag input triggers the escalation card
    When the card is rendered in the chat messages area
    Then the card container should have role="alert"
    And it should have aria-live="assertive"

  Scenario: User message bubble is still shown before the escalation card
    Given I type "I have a fever" and submit
    When the safety gate triggers
    Then my message "I have a fever" should appear as a user bubble first
    And the escalation card should appear below it
    And no coach bubble should appear


Rule: Safety Gate — Claude Is Never Called On Red Flags

  Scenario: API route /api/chat is not called when gate triggers
    Given the safety gate is wired into the chat submit handler
    When I submit any input that triggers isSafeToCoach() = false
    Then no HTTP request should be made to "/api/chat"
    And the console should log "[Safety gate triggered]" with the category and matched flags

  Scenario: Gate runs synchronously before any async operation
    Given I submit a red flag message
    Then isSafeToCoach() must complete before any fetch() or API call is initiated
    And the escalation card must render without any network delay

  Scenario: getMatchedFlags logs which patterns fired
    Given I submit "I have a fever and red streaks"
    When the safety gate triggers
    Then console.info should be called with "[Safety gate triggered]"
    And the log object should contain:
      | Field    | Description                    |
      | category | "infection"                    |
      | flags    | array of matched pattern strings |
    And the log should NOT be visible to the end user in the UI
