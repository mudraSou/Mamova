# ============================================================
# PHASE 1 — CONTENT EDGE CASES
# Covers: malformed JSON, missing fields, empty arrays,
#         special characters, XSS, very long strings,
#         screen size extremes, rapid interactions
# ============================================================

Feature: JSON Data Integrity — Symptom Cards

  Scenario: App handles a completely empty symptom cards array
    Given bf_symptom_cards.json returns an empty array []
    When the symptoms screen loads
    Then I should NOT see an error screen
    And I should see a "No symptoms available" empty state
    And the app should NOT crash

  Scenario: App handles a card with missing optional fields
    Given a symptom card has no "peak_timing" field
    When I view that card's detail screen
    Then the "Typical timing" line should not render
    And no "undefined" or "null" text should appear

  Scenario: App handles a card with empty immediate_relief_steps array
    Given a symptom card has immediate_relief_steps: []
    When I view that card's detail screen
    Then the steps section should show "No specific steps listed."
    And it should NOT crash or render empty numbered circles

  Scenario: App handles a card with empty dos array
    Given a symptom card has dos: []
    When I view that card's detail screen
    Then the Do's box should render with an empty list
    And no bullet points should appear
    And no "undefined" text should appear

  Scenario: App handles a card with empty red_flags array
    Given a symptom card has red_flags: []
    When I view that card's detail screen
    Then the red flags section should still be visible
    And it should show "No red flags listed" or an equivalent message
    And the section should NOT be hidden (always visible rule)

  Scenario: App handles null values in card string fields
    Given a card has what_it_is: null
    When I view that card's detail screen
    Then the "What this likely is" section should show empty or a fallback message
    And no "null" string should appear in the rendered UI

  Scenario: Malformed JSON returns error state
    Given bf_symptom_cards.json returns invalid JSON (syntax error)
    When the symptoms screen loads
    Then the error screen should appear
    And the "Try again" button should be visible
    And the browser console should log the parse error

  Scenario: JSON fetch returns 404
    Given bf_symptom_cards.json returns a 404 status
    When the symptoms screen loads
    Then the error state should be shown
    And the error detail should read "Server returned 404"

  Scenario: JSON fetch returns 200 but non-array body
    Given bf_symptom_cards.json returns {"error": "not found"}
    When the symptoms screen loads
    Then the error state should appear with message "Unexpected data format"
    And the app should NOT attempt to render the object as a card list


Rule: XSS and Special Character Safety

  Scenario: Symptom title containing HTML tags is escaped
    Given a symptom card title contains "<script>alert('xss')</script>"
    When I view the symptom list
    Then the script tag should be rendered as plain text
    And no JavaScript should execute from the card content

  Scenario: Symptom content containing ampersands renders correctly
    Given a card's what_it_is contains "Milk & feeding issues"
    When I view the detail screen
    Then the text should display as "Milk & feeding issues"
    And it should NOT display as "Milk &amp; feeding issues"

  Scenario: Step description with angle brackets is safely escaped
    Given a step description contains "Turn baby's head <45 degrees>"
    When I view the step
    Then the text should render literally as "Turn baby's head <45 degrees>"
    And no HTML elements should be injected

  Scenario: User-typed content in chat input is never injected as raw HTML
    Given I type "<img src=x onerror=alert(1)>" in the chat input
    When I send the message
    Then my message bubble should display the text literally
    And no image element should be created
    And no alert should fire


Rule: Long Content Edge Cases

  Scenario: Very long symptom title wraps correctly on small screens
    Given a symptom card title is 80+ characters long
    When I view the symptom list on a 320px wide screen
    Then the title should wrap to multiple lines
    And it should NOT overflow its container
    And the severity pill should remain visible

  Scenario: Very long step instruction stays within card bounds
    Given a step has an instruction of 300+ characters
    When I view the step card
    Then the text should wrap within the card
    And it should NOT overflow or clip

  Scenario: Chat input respects 500 character maxlength
    Given I type exactly 501 characters in the chat input
    Then the input should contain at most 500 characters
    And characters beyond 500 should be rejected silently
    And the send button should be enabled (not disabled by overflow)

  Scenario: Very long coach response renders without breaking layout
    Given the coach agent returns a 2,000 character response
    When the response streams into the chat bubble
    Then the bubble should expand vertically to contain the text
    And the message list should scroll to show the bottom of the response
    And the input bar should remain accessible at the bottom


Rule: Rapid Interaction Edge Cases

  Scenario: Rapid tab switching does not render mixed content
    Given I rapidly tap Symptoms → Positions → Symptoms in under 500ms
    Then the final visible screen should be Symptoms only
    And no Positions content should appear mixed into the Symptoms screen
    And no JavaScript error should be thrown

  Scenario: Double-tapping a symptom card does not open two detail screens
    Given I double-tap a symptom card quickly
    Then only one detail screen should render
    And no duplicate content should appear

  Scenario: Tapping back button while screen is mid-transition is safe
    Given a detail screen is animating in (within 280ms of navigation)
    When I tap the back button during the animation
    Then the app should return to the list safely
    And no blank screen or broken state should appear

  Scenario: Tapping retry while already loading does not trigger duplicate fetches
    Given the symptoms loading state is active
    When I navigate away and back before the fetch completes
    Then only one fetch request to bf_symptom_cards.json should be in-flight at a time

  Scenario: Submitting chat while previous response is streaming is prevented
    Given a coach response is currently streaming
    Then the send button should be disabled
    And pressing Enter should not send another message
    And the input should remain editable for typing the next message


Rule: Screen Size and Responsive Edge Cases

  Scenario: Symptom cards render correctly at 320px width (smallest phone)
    Given the viewport width is 320px
    When I view the symptom list
    Then all cards should be fully visible without horizontal scroll
    And the severity pill should not be cut off
    And the "View guide" action should be on a separate line if needed

  Scenario: Do's and Don'ts grid stacks vertically below 400px
    Given the viewport width is 360px
    When I view a symptom detail screen
    Then the Do's and Don'ts should be stacked vertically (single column)
    And neither column should overflow its container

  Scenario: Bottom nav is fully usable on 320px screen
    Given the viewport width is 320px
    When I view the bottom navigation
    Then all three tab buttons should be visible without horizontal scroll
    And each tap target should be at minimum 44px in height
    And labels should be fully legible

  Scenario: Chat input bar is not obscured by iOS virtual keyboard
    Given I am on the chat screen on an iOS device
    When I tap the chat input and the virtual keyboard appears
    Then the input bar should remain visible above the keyboard
    And I should not need to scroll to see the input
    And the message list should resize to fit the remaining space


Rule: Offline Edge Cases

  Scenario: App gracefully degrades when fetching positions while offline
    Given the user has visited the Positions tab before (content cached)
    And the device goes offline mid-session
    When the user navigates back to the Positions tab
    Then cached position data should load from the service worker
    And no error screen should appear

  Scenario: Bookmarking while offline queues the action
    Given the user is offline
    When they tap the bookmark button on a detail screen
    Then the bookmark should be saved locally
    And when the device comes back online the bookmark should sync to Supabase

  Scenario: Chat is disabled with a clear message when offline
    Given the device is offline
    When the user opens the Coach tab
    Then the chat input should be disabled
    And a message should explain that coaching requires a connection
    And the send button should be disabled

  Scenario: Service worker cache does not serve stale safety content
    Given escalation_card.json has been updated with new crisis numbers
    When the service worker refreshes in the background
    Then the new version of escalation_card.json should be served
    And the old version should be evicted from cache within 24 hours
