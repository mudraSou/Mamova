# ============================================================
# PHASE 2 — TRIAGE EDGE CASES (Fuse.js client-side search)
# Covers: Fuse.js accuracy, threshold behaviour, ambiguous
#         inputs, typos, negations, non-English, empty/short
#         inputs, safety gate priority over triage
# ============================================================

Feature: Fuse.js Search — Accuracy

  Scenario Outline: Symptom phrases match the correct slug with high confidence
    Given the symptom cards are loaded into Fuse.js
    When I search for "<query>"
    Then triageLocally() should return slug "<slug>" with confidence "high"

    Examples:
      | query                                                       | slug            |
      | my breasts are rock hard and painful                        | engorgement     |
      | baby feeds every hour constantly won't stop                 | cluster-feeding |
      | nipples are cracked and it burns when baby latches          | cracked-nipples |
      | I don't think I have enough milk                            | low-supply      |
      | breast is hot red and I feel like I have flu                | mastitis        |
      | baby keeps slipping off and can't seem to latch             | latch-issues    |
      | engorged breasts feel like rocks                            | engorgement     |
      | why is baby always hungry feeding all the time              | cluster-feeding |

  Scenario: Top result score below 0.25 is classified as high confidence
    Given Fuse.js returns a result with score 0.18
    Then confidence should be "high"
    And the app should navigate to that symptom's detail screen

  Scenario: Top result score above 0.25 is classified as low confidence
    Given Fuse.js returns a result with score 0.38
    Then confidence should be "low"
    And the full symptom list should be shown instead of auto-navigating

  Scenario: No Fuse.js results returns low confidence
    Given Fuse.js returns an empty results array
    Then triageLocally() should return slug null and confidence "low"
    And the full symptom list should be shown


Rule: Fuse.js Search — Typos and Variations

  Scenario Outline: Common misspellings still route correctly
    When I search for "<misspelled_query>"
    Then the result slug should be "<expected_slug>"

    Examples:
      | misspelled_query                      | expected_slug   |
      | my breests are very painfull          | engorgement     |
      | babby keeps slipping durring feeds    | latch-issues    |
      | nipels are craked and hurting         | cracked-nipples |
      | clustr feeding all nigt               | cluster-feeding |
      | masitis symptoms                      | mastitis        |

  Scenario: Single character typo still returns correct card
    Given I search for "engorgemnt" (missing 'e')
    Then Fuse.js should still return "engorgement" with confidence "high"

  Scenario: Input with extra spaces is handled correctly
    Given I search for "  my   breast   hurts  " (multiple spaces)
    Then Fuse.js should trim and normalise the input before searching
    And a valid result should be returned


Rule: Fuse.js Search — Short and Edge Inputs

  Scenario: Single word input returns a result where possible
    Given I search for "engorgement"
    Then the result slug should be "engorgement" with confidence "high"

  Scenario: Two character input returns low confidence
    Given I search for "pa"
    Then triageLocally() should return confidence "low"
    And the full symptom list should be shown

  Scenario: Input with only whitespace is rejected before Fuse.js runs
    Given I enter "   " (whitespace only) in the triage input
    Then Fuse.js should NOT be called
    And no result should be shown
    And the symptom list should remain unchanged

  Scenario: Input with only numbers returns low confidence
    Given I search for "123456"
    Then triageLocally() should return confidence "low"
    And the symptom list should be shown

  Scenario: Input with only special characters returns low confidence
    Given I search for "!@#$%"
    Then Fuse.js should not crash
    And confidence should be "low"
    And the symptom list should be shown

  Scenario: Very long input (500 chars) is truncated before Fuse.js search
    Given I paste a 500 character description
    Then Fuse.js should receive at most the first 300 characters
    And the search should complete without performance degradation
    And a result should be returned within 200ms

  Scenario: Input that is a question works the same as a statement
    Given I search for "why are my breasts so hard and painful?"
    Then the result should be "engorgement" same as the statement version
    And the question mark should not affect the match


Rule: Fuse.js Search — Ambiguous Inputs

  Scenario: Ambiguous input matching two symptoms equally returns low confidence
    Given an input matches "engorgement" with score 0.30 and "mastitis" with score 0.31
    Then confidence should be "low"
    And the full symptom list should be shown
    And both symptom cards should be visible for the user to choose

  Scenario: Generic pain description returns low confidence
    Given I search for "pain"
    Then confidence should be "low"
    And the full symptom list should be shown to let the user pick

  Scenario: Emotional wellbeing input attempts to match emotional category
    Given I search for "I feel very low and isolated since the baby came"
    Then Fuse.js should search against the "emotional" category cards
    And if a match is found it should be returned
    And if no match, confidence should be "low" and the list shown


Rule: Fuse.js Search — Non-English and Mixed Language Inputs

  Scenario: Hindi transliteration input is handled without crash
    Given I search for "dudh kam ho raha hai" (Hindi transliteration for low supply)
    Then Fuse.js should not throw an error
    And confidence should be "low" (expected — not a supported language yet)
    And the symptom list should be shown as fallback

  Scenario: Mixed English-Hindi input does not crash
    Given I search for "breast mein pain hai"
    Then Fuse.js should process it without error
    And the app should not crash
    And the symptom list should be shown as fallback

  Scenario: Non-ASCII characters are handled safely
    Given I search for "douleur aux seins" (French)
    Then Fuse.js should not crash
    And no unhandled exception should be thrown


Rule: Fuse.js — Safety Gate Priority

  Scenario: Safety gate runs before Fuse.js on every triage submission
    Given I type any input in the triage search box
    When I submit
    Then isSafeToCoach() must be called BEFORE Fuse.js search runs
    And if isSafeToCoach() returns false, Fuse.js must NOT be called at all

  Scenario: Red flag input in triage search shows escalation card not a symptom card
    Given I type "my breast is hot and I have a fever" in the triage input
    When I submit
    Then the safety gate should trigger
    And the infection escalation card should appear
    And Fuse.js should NOT be called
    And the user should NOT be routed to the mastitis symptom card

  Scenario: Borderline input matching both red flag and symptom routes to escalation
    Given I type "hot hard breast with flu symptoms" in the triage input
    When I submit
    Then the safety gate should take priority over Fuse.js routing
    And the escalation card should be shown
    And the mastitis symptom card should NOT be auto-opened


Rule: Fuse.js — Performance

  Scenario: Triage search completes within 200ms for all inputs
    Given 25 symptom cards are loaded into Fuse.js
    When I submit any search query
    Then triageLocally() should return a result within 200 milliseconds
    And the UI should update without a visible delay

  Scenario: Fuse.js index is built once on data load, not per search
    Given symptom cards have loaded
    Then the Fuse instance should be created once and reused
    And each subsequent search should NOT rebuild the index

  Scenario: Fuse.js instance is rebuilt only when card data changes
    Given a new version of bf_symptom_cards.json is loaded
    When the symptom cards are refreshed
    Then the Fuse index should be rebuilt with the new data
    And old stale data should not persist in the search index
