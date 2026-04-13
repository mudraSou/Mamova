# ============================================================
# PHASE 3 — SAFETY GATE EDGE CASES
# Covers: negations, past tense, third-person, borderline
#         cases, typos in red flag words, compound sentences,
#         false positive policy, multi-flag messages,
#         partial word matches, Unicode, repeated submissions
# ============================================================

Feature: Safety Gate — Negation Handling

  # DESIGN DECISION (documented here for IBCLC and legal review):
  # The safety gate errs on the side of caution.
  # "I don't have a fever" WILL trigger the gate.
  # False positives (showing escalation when not needed) are
  # SAFER than false negatives (missing a real emergency).
  # A user shown the escalation card unnecessarily sees a
  # supportive message. A user NOT shown it during an emergency
  # may not get help in time. This is an intentional design choice.

  Scenario: Negated fever phrase still triggers the gate (by design)
    When I call isSafeToCoach("I don't have a fever but my breast hurts")
    Then it should return false
    And this is the EXPECTED and CORRECT behaviour by design

  Scenario: "No fever" phrase still triggers the gate (by design)
    When I call isSafeToCoach("No fever, just a hard lump on my breast")
    Then it should return false
    And the default escalation card should be shown

  Scenario: "Used to have fever" phrase triggers the gate (by design)
    When I call isSafeToCoach("I used to have fever last week")
    Then it should return false
    And this conservative behaviour is documented and accepted

  Scenario: Negation design decision is documented in safety.js
    Given I read the safety.js source file
    Then it should contain a comment explaining the false-positive-preferred policy
    And the comment should be attributable to a specific decision (not accidental)


Rule: Safety Gate — Past Tense Inputs

  Scenario: Past fever fully resolved is still flagged (conservative)
    When I call isSafeToCoach("I had a fever three days ago, it's gone now")
    Then it should return false
    And the escalation card should be shown
    And the user can dismiss it and return to normal coaching

  Scenario: Historical mastitis mention triggers gate
    When I call isSafeToCoach("I had mastitis with my first baby")
    Then it should return false
    And the infection escalation card should be shown

  Scenario: Resolved bleed mention triggers gate
    When I call isSafeToCoach("My nipple bled yesterday but seems fine now")
    Then it should return false
    And the bleeding escalation card should be shown


Rule: Safety Gate — Third-Person Inputs

  Scenario: Third-person fever mention triggers the gate
    When I call isSafeToCoach("My friend has a fever and red streaks")
    Then it should return false
    And this is correct — we cannot verify who the symptoms belong to

  Scenario: Question about someone else's symptoms triggers gate
    When I call isSafeToCoach("Can mastitis cause fever in other mothers?")
    Then it should return false
    And the gate should not attempt to parse the educational intent

  Scenario: "My doctor mentioned mastitis" triggers gate
    When I call isSafeToCoach("My doctor mentioned I might have mastitis")
    Then it should return false
    And the infection escalation card should be shown with the "keep feeding" reassurance


Rule: Safety Gate — Typos in Red Flag Words

  Scenario Outline: Common typos in red flag words still trigger the gate
    When I call isSafeToCoach("<typo_input>")
    Then it should return false

    Examples:
      | typo_input                          |
      | I have a fevar                      |
      | feever and chills since yesterday   |
      | masitis is what I think I have      |
      | red streeks on my breast            |
      | I feel suicidel                     |

  Scenario: Severely misspelled red flag word may not trigger — this is acceptable
    When I call isSafeToCoach("I have fvr and feel terrible")
    Then it MAY return true (pattern may not match severe misspelling)
    And this limitation should be documented
    And the chat response should still encourage medical consultation for "feeling terrible"

  Scenario: Single character substitution typo still triggers when close enough
    When I call isSafeToCoach("I have a feyer and sore breast")
    Then the fever pattern should attempt a match
    And if the pattern does not match, this is a known limitation, not a bug


Rule: Safety Gate — Partial Word Matches

  Scenario: "Mastitis" should NOT be triggered by unrelated words containing those letters
    When I call isSafeToCoach("I am a fantastic mother")
    Then it should return true
    And the word "fantastic" should NOT trigger any red flag pattern

  Scenario: "Fever" in "Fever dream" does trigger the gate (by design)
    When I call isSafeToCoach("I had a fever dream about breastfeeding")
    Then it should return false
    And this is an acceptable false positive given the stakes

  Scenario: "Bleed" in "I need" should NOT trigger
    When I call isSafeToCoach("I need help with my latch")
    Then it should return true
    And the word "need" should NOT match the bleeding pattern

  Scenario: "Crack" in "cracker" should NOT trigger the cracked nipple pattern
    When I call isSafeToCoach("I was eating crackers while feeding")
    Then it should return true
    And the \bcrack pattern with word boundary should prevent false match

  Scenario: "Suicidal" matched only as a whole word via \b boundary
    When I call isSafeToCoach("I'm feeling asocial since the baby came")
    Then it should return true
    And "asocial" should NOT match the suicidal pattern


Rule: Safety Gate — Compound and Multi-Clause Sentences

  Scenario: Message with red flag in a subordinate clause triggers gate
    When I call isSafeToCoach("The baby is feeding well but I have a fever")
    Then it should return false
    And the infection escalation card should be shown

  Scenario: Message with multiple red flags triggers gate once
    When I call isSafeToCoach("I have fever, red streaks, and I feel suicidal")
    Then isSafeToCoach() should return false
    And classifyEscalationCategory() should return "mental_health"
    And mental health should take priority over infection in classification

  Scenario: Message that starts positive and ends with red flag triggers gate
    When I call isSafeToCoach("Baby latched great today but I have red streaks and a lump")
    Then it should return false
    And the full message should be scanned, not just the beginning

  Scenario: Comma-separated list containing a red flag triggers correctly
    When I call isSafeToCoach("I have engorgement, pain, fever, and cluster feeding")
    Then it should return false
    And the infection escalation card should be shown


Rule: Safety Gate — Borderline Cases (Documented)

  Scenario: Sore nipples alone does NOT trigger the gate
    When I call isSafeToCoach("my nipples are really sore after every feed")
    Then it should return true
    And this should route to the coach or triage

  Scenario: Hard breast alone does NOT trigger the gate
    When I call isSafeToCoach("my breast feels very hard and full")
    Then it should return true
    And this should route to the engorgement card or coach

  Scenario: Pain alone does NOT trigger the gate
    When I call isSafeToCoach("I have a lot of pain when breastfeeding")
    Then it should return true
    And this should route to the coach or triage

  Scenario: "warm" breast alone does NOT trigger the gate
    When I call isSafeToCoach("my breast feels warm after a feed")
    Then it should return true
    And only "warm to touch" as a phrase triggers — not "warm" alone

  Scenario: "warm to touch" breast DOES trigger the gate
    When I call isSafeToCoach("my breast is warm to touch and hard")
    Then it should return false
    And the infection escalation card should be shown

  Scenario: Baby jaundice mention triggers the gate
    When I call isSafeToCoach("my newborn looks a bit yellow, is that jaundice?")
    Then it should return false
    And the baby_emergency escalation card should be shown


Rule: Safety Gate — Repeated and Rapid Submissions

  Scenario: Submitting the same red flag message twice shows escalation card both times
    Given I submit "I have a fever" and see the escalation card
    When I submit "I have a fever" again
    Then the escalation card should appear again
    And it should NOT be suppressed because it was "already shown"

  Scenario: Rapid submission of red flag followed by safe message
    Given I submit "I have a fever" (red flag)
    And the escalation card renders
    When I immediately type and submit "how do I latch correctly" (safe)
    Then the latch question should route to the coach
    And the escalation card from the prior message should remain in the history

  Scenario: Safety gate is stateless — each message evaluated independently
    Given the chat history contains 10 prior safe messages
    When a new message containing a red flag is submitted
    Then the gate should trigger on the new message regardless of prior history
    And history does not affect the gate's evaluation of the current message


Rule: Safety Gate — Unicode and Encoding

  Scenario: Degree symbol in temperature triggers fever pattern
    When I call isSafeToCoach("temperature is 38°C")
    Then it should return false
    And the 38°C pattern should match correctly

  Scenario: Temperature without degree symbol triggers fever pattern
    When I call isSafeToCoach("temp is 38 C")
    Then it should return false

  Scenario: Emoji in message does not break safety check
    When I call isSafeToCoach("I have a fever 🤒 and red streaks")
    Then it should return false
    And the emoji should not interfere with pattern matching

  Scenario: Unicode apostrophe in "don't" is handled correctly
    When I call isSafeToCoach("I don\u2019t want to live") (smart apostrophe)
    Then it should return false
    And the mental health pattern should match despite the Unicode apostrophe

  Scenario: Null bytes or control characters in input do not crash the gate
    Given the input contains a null byte "\u0000"
    When isSafeToCoach() is called
    Then it should return true (safe fallback) and not throw an exception


Rule: Safety Gate — getMatchedFlags() Logging

  Scenario: getMatchedFlags returns all matching patterns for a multi-flag message
    When I call getMatchedFlags("I have fever, red streaks, and feel suicidal")
    Then the returned array should contain at least 3 pattern strings
    And each entry should be the string representation of the matched regex

  Scenario: getMatchedFlags returns empty array for safe input
    When I call getMatchedFlags("how do I do the football hold")
    Then the returned array should be empty []

  Scenario: getMatchedFlags output is never shown in the UI
    Given any red flag message is submitted in chat
    Then the matched flags array should only appear in console.info
    And no element in the DOM should display raw regex pattern strings
    And no element should display the text "getMatchedFlags" or "Safety gate triggered"
