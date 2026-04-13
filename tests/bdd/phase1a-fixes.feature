# ============================================================
# PHASE 1A — IMMEDIATE FIXES (current plain JS app)
# Covers: Day N calculation, icon names, placeholder gate,
#         dark mode wiring, focus management, mental health
#         fallback, reviewed_by on positions
# ============================================================

Feature: Day N Calculation

  # Clinical convention: Day 1 = day of birth. Not Day 0.
  # The ideas doc pain timeline says "Days 1–3: afterpains"
  # Formula: Math.floor((today - deliveryDate) / 86400000) + 1

  Scenario Outline: Day number matches clinical convention
    Given delivery date is "<delivery_date>"
    And today is "<today>"
    Then the displayed day number should be <expected_day>

    Examples:
      | delivery_date | today      | expected_day |
      | 2026-04-10    | 2026-04-10 | 1            |
      | 2026-04-05    | 2026-04-10 | 6            |
      | 2026-04-01    | 2026-04-10 | 10           |
      | 2026-04-01    | 2026-05-01 | 31           |
      | 2026-04-01    | 2026-05-10 | 40           |

  Scenario: Day 1 is shown on the birth day itself
    Given delivery date is today's date
    When the home screen loads
    Then the greeting should show "Day 1"
    And it should NOT show "Day 0"

  Scenario: Day counter does not go negative
    Given a delivery date set in the future (data entry error)
    When the home screen loads
    Then the app should NOT display a negative day number
    And it should display "Day 1" as a safe fallback

  Scenario: Day 40 boundary is handled gracefully
    Given delivery date was exactly 40 days ago
    When the home screen loads
    Then the app should display "Day 40"
    And no content targeting beyond day 40 should appear

  Scenario: Day beyond 40 is handled without crashing
    Given delivery date was 50 days ago
    When the home screen loads
    Then the app should NOT crash
    And it should show a graceful message that the 40-day guide is complete


Rule: Material Symbol Icon Verification

  Scenario Outline: Position card icons render correctly
    Given the positions list has loaded
    When I view the card for "<position>"
    Then the icon "<icon>" should render as a visible symbol
    And it should NOT show an empty box or question mark

    Examples:
      | position          | icon              |
      | Cradle Hold       | child_care        |
      | Cross-Cradle Hold | self_care         |
      | Football Hold     | sports            |
      | Side-Lying        | crib              |
      | Laid-Back Hold    | weekend           |

  Scenario: No position card shows a broken icon placeholder
    When all 5 position cards are visible
    Then none should display an empty icon box
    And all icon containers should have a non-zero rendered size


Rule: Placeholder Content Gate (Pre-push Hook)

  Scenario: Pre-push hook blocks SYNTHETIC_PLACEHOLDER
    Given a developer runs git push with bf_symptom_cards.json
    And any card contains "reviewed_by": "SYNTHETIC_PLACEHOLDER"
    Then the pre-push hook should exit with code 1
    And the push should be blocked
    And the error message should name the problematic file

  Scenario: Pre-push hook blocks bracketed IBCLC placeholder
    Given escalation_card.json contains "[IBCLC name — fill before launch]"
    When a developer runs git push
    Then the pre-push hook should block the push
    And the output should contain the string "[IBCLC name"

  Scenario: Pre-push hook passes when all placeholders are filled
    Given all reviewed_by fields contain a real name
    And no file contains a bracketed placeholder pattern
    When a developer runs git push
    Then the hook should exit with code 0
    And the push should proceed normally

  Scenario: Hook scans all JSON files, not just one
    Given bf_positions.json has an empty reviewed_by field
    And bf_symptom_cards.json has SYNTHETIC_PLACEHOLDER
    When a developer runs git push
    Then the hook should report both files as failing
    And neither should be allowed through


Rule: Dark Mode Wiring

  Scenario: Dark mode activates on page load when system is dark
    Given the browser's prefers-color-scheme is "dark"
    When the page loads
    Then document.documentElement should have the class "dark"
    And this should happen before the first paint (no flash of light mode)

  Scenario: Light mode is default when system preference is light
    Given the browser's prefers-color-scheme is "light"
    When the page loads
    Then document.documentElement should NOT have the class "dark"

  Scenario: Dark mode updates without page reload when system changes
    Given the app is open in light mode
    When window.matchMedia prefers-color-scheme fires a "dark" change event
    Then document.documentElement should gain the "dark" class immediately
    And no page reload or flash should occur

  Scenario: Dark mode tokens render correctly on key surfaces
    Given dark mode is active
    Then the top app bar background should use the dark surface token
    And the bottom nav background should use the dark surface token
    And symptom card backgrounds should use dark surface tokens
    And text should NOT be pure black (#000000)


Rule: Focus Management on Screen Transitions

  Scenario: Focus moves to h1 when navigating to symptom detail
    Given I am on the symptom list
    When I tap a symptom card
    Then keyboard focus should be placed on the detail screen's h1 element
    And the h1 should have tabindex="-1"
    And a screen reader should announce the new heading

  Scenario: Focus moves to h1 when navigating to position detail
    Given I am on the positions list
    When I tap a position card
    Then keyboard focus should be placed on the position detail h1

  Scenario: Focus moves to heading when returning to symptom list
    Given I am on a symptom detail screen
    When I tap the back button
    Then focus should move to the symptom list heading

  Scenario: Focus is not lost to a non-existent element
    Given any screen transition occurs
    Then the element receiving focus must exist in the DOM at the time of focus
    And document.activeElement should not be document.body after transition


Rule: Mental Health Fallback — Crisis Numbers Hardcoded

  Scenario: Mental health escalation fallback contains crisis line when JSON fails
    Given escalation_card.json fails to load (network error)
    When the chat safety gate triggers a mental_health escalation
    Then the fallback escalation card should display at minimum one crisis number
    And it should NOT show only "call your doctor"
    And it should show iCall: 9152987821

  Scenario: Hardcoded fallback renders for mental health before JSON loads
    Given the chat screen has just opened
    And escalation_card.json has not yet been fetched
    When the user immediately types a mental health red flag and submits
    Then the hardcoded fallback escalation card should render
    And a crisis number must be visible to the user

  Scenario: Fallback does not silently fail
    Given escalation_card.json returns a 500 error
    When any safety gate escalation is triggered
    Then the app should render the hardcoded fallback card
    And no blank space or undefined text should appear in the card


Rule: Positions reviewed_by Field

  Scenario: All 5 positions have a reviewed_by field in the JSON
    When bf_positions.json is loaded
    Then every position object should have a "reviewed_by" key
    And every position object should have a "last_reviewed_at" key

  Scenario: Empty reviewed_by does not render a reviewer line in the UI
    Given a position has reviewed_by: ""
    When I view that position's detail screen
    Then the disclaimer footer should show the disclaimer text
    And it should NOT show a blank "Reviewed by" line

  Scenario: Filled reviewed_by renders reviewer information
    Given a position has reviewed_by: "Dr. Priya Sharma, IBCLC"
    When I view that position's detail screen
    Then the footer should display "Dr. Priya Sharma, IBCLC"
