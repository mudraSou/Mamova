# ============================================================
# PHASE 2 — SYMPTOM TRIAGE AGENT
# Covers: free-text input, high-confidence routing,
#         low-confidence fallback, API error handling,
#         triage never generating medical content directly
# ============================================================

Feature: Free-Text Symptom Input

  Background:
    Given the user is on the Symptoms screen
    And the triage agent is available at "/api/triage"

  Scenario: Free-text search box is visible on the symptoms screen
    Then I should see a text input with placeholder "Describe what you're feeling…"
    And the input should be focusable and accessible via keyboard

  Scenario: Submitting an empty input does nothing
    Given the search input is empty
    When I tap the search button or press Enter
    Then no API call should be made
    And I should remain on the symptom list


Rule: Triage Agent — High Confidence Routing

  Scenario Outline: Common symptom descriptions route to the correct card
    Given I type "<user_input>" in the free-text search box
    When I submit the search
    Then the triage API should respond with slug "<expected_slug>"
    And the app should navigate to the detail screen for "<expected_slug>"
    And the URL should change to "/symptoms/<expected_slug>"

    Examples:
      | user_input                                               | expected_slug   |
      | my breasts are rock hard and painful                     | engorgement     |
      | baby is feeding every hour and won't stop                | cluster-feeding |
      | my nipples are cracked and bleeding every feed           | cracked-nipples |
      | I don't think I have enough milk for my baby             | low-supply      |
      | my breast has a hot red lump and I feel flu-like         | mastitis        |
      | baby can't seem to latch properly keeps sliding off      | latch-issues    |

  Scenario: High confidence result shows a "Matched symptom" indicator
    Given I searched for "rock hard painful breasts"
    When the triage result loads
    Then I should see a label like "Best match: Engorgement"
    And I should see a link to "View all symptoms" in case the match is wrong

  Scenario: Triage agent output is always a slug — never free-form medical text
    Given I submit any symptom description
    When the triage API responds
    Then the response body should contain only:
      | Field       | Type    |
      | slug        | string  |
      | confidence  | string  |
    And the response should NOT contain generated medical advice or explanations


Rule: Triage Agent — Low Confidence Fallback

  Scenario: Low confidence result shows the full symptom picker
    Given I type "I'm not sure what's wrong, something feels off"
    When I submit the search
    And the triage API responds with confidence "low"
    Then I should NOT be automatically navigated to a detail screen
    And I should see a message like "We couldn't pinpoint this exactly"
    And the full symptom card list should be shown for me to browse

  Scenario: Ambiguous input with multiple possible matches shows the symptom list
    Given I type "pain"
    When I submit the search
    And the triage API responds with confidence "low"
    Then the full symptom list should be displayed
    And no single card should be auto-selected

  Scenario: Low confidence threshold is applied correctly
    Given the triage API returns confidence "low" for a message
    Then the app must not navigate to any detail screen
    And the symptom list must remain fully browsable


Rule: Triage Agent — API Error Handling

  Scenario: Triage API timeout shows a graceful fallback
    Given the triage API call times out after 5 seconds
    When I submit a symptom description
    Then I should see a message "Couldn't connect — browse symptoms below"
    And the full symptom list should remain visible and usable
    And no blank screen or unhandled error should appear

  Scenario: Triage API 500 error falls back to symptom list
    Given the triage API returns a 500 error
    When I submit a symptom description
    Then the app should fall back to showing the full symptom list
    And the user should see a soft error notice

  Scenario: Triage result with unknown slug is handled safely
    Given the triage API returns a slug that does not exist in the loaded card data
    When the app tries to navigate to that detail screen
    Then the app should NOT crash or show a blank screen
    And the user should be shown the symptom list with a "could not find result" message


Rule: Triage Agent — Safety Boundary

  Scenario: Triage agent does not route red-flag input — it defers to the safety gate
    Given I type "I have a fever and red streaks on my breast"
    When I submit the search via the triage input
    Then the safety check should run BEFORE the triage API is called
    And if any red flag pattern matches, the escalation card should be shown
    And the triage API should NOT be called for red-flag input

  Scenario: Safety check runs before triage API on every submission
    Given any free-text submission is made
    Then window.Safety.isSafeToCoach() must be called first
    And only if it returns true should the triage API be called
