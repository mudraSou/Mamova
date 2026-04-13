# ============================================================
# PHASE 1 — AUTH, ONBOARDING, NAVIGATION, HOME
# Covers: magic link auth, onboarding flow, home dashboard,
#         bottom nav state, dark mode, offline / PWA
# ============================================================

Feature: Magic Link Authentication

  Scenario: User can request a magic link
    Given I am on the "/login" page
    When I enter a valid email address "test@example.com"
    And I tap "Send link"
    Then I should see a confirmation message "Check your inbox"
    And Supabase Auth should have sent a magic link email to "test@example.com"
    And the email should be delivered via Resend

  Scenario: Invalid email shows a validation error
    Given I am on the "/login" page
    When I enter "notanemail"
    And I tap "Send link"
    Then I should see an inline error "Please enter a valid email address"
    And no email should be sent

  Scenario: Magic link callback creates a session
    Given a valid magic link has been sent to "test@example.com"
    When the user clicks the link and lands on "/auth/callback"
    Then a Supabase session should be created
    And the user should be redirected to "/onboarding" if no profile exists
    And the user should be redirected to "/" if a profile already exists

  Scenario: Expired or invalid magic link shows an error
    Given the user clicks an expired or malformed magic link
    When they land on "/auth/callback"
    Then they should see an error message
    And they should be offered a link to return to "/login"

  Scenario: Signed-in user visiting /login is redirected to home
    Given I am already signed in
    When I navigate to "/login"
    Then I should be redirected to "/"


Rule: Onboarding

  Background:
    Given I have just signed in for the first time
    And I have been redirected to "/onboarding"

  Scenario: Onboarding collects three required fields
    When I complete the onboarding form
    Then I should be asked for:
      | Field         |
      | Baby's name   |
      | Delivery date |
      | Delivery type |
    And all three fields should be required before I can proceed

  Scenario: Delivery type options are correct
    When I reach the delivery type step
    Then I should see exactly two options:
      | Option          |
      | Vaginal         |
      | C-section       |

  Scenario: Onboarding saves profile to Supabase
    Given I enter baby name "Arjun", delivery date "2026-04-05", type "vaginal"
    When I tap "Done" or "Get started"
    Then a profile record should exist in Supabase with:
      | Field         | Value      |
      | baby_name     | Arjun      |
      | delivery_date | 2026-04-05 |
      | delivery_type | vaginal    |
    And I should be redirected to "/"

  Scenario: Returning user skips onboarding
    Given I have completed onboarding previously
    When I sign in again
    Then I should be redirected directly to "/"
    And I should NOT see the onboarding screen


Rule: Home Dashboard

  Background:
    Given I am signed in with a profile:
      | baby_name     | Meera      |
      | delivery_date | 2026-04-05 |
      | delivery_type | vaginal    |
    And today's date is 2026-04-10

  Scenario: Home shows personalised Day N greeting
    When I navigate to "/"
    Then I should see "Day 5"
    And I should see "Meera" in the greeting

  Scenario: Day number is calculated from delivery date correctly
    Given delivery date is 2026-04-05 and today is 2026-04-10
    Then the displayed day number should be 5

  Scenario: C-section mothers see adapted content
    Given delivery type is "c-section"
    When I navigate to "/"
    Then positions filtered for C-section recovery should be surfaced
    And the Football Hold card should be prominently shown

  Scenario: Day-relevant symptoms are surfaced on home
    Given today is Day 4
    When I view the home screen
    Then symptom cards tagged "day-3-5" should be shown
    And symptom cards tagged "day-14-28" should NOT be shown


Rule: Bottom Navigation

  Scenario: Symptoms tab is active by default on first load
    When the app loads for the first time
    Then the Symptoms tab should have aria-current="page"
    And the Symptoms tab should show the active pill style

  Scenario: Tapping Positions tab activates it and deactivates Symptoms
    Given the Symptoms tab is active
    When I tap the Positions tab
    Then the Positions tab should have aria-current="page"
    And the Positions tab should show the active style
    And the Symptoms tab should NOT have the active style

  Scenario: Tapping Coach tab activates it
    When I tap the Coach tab
    Then the Coach tab should have aria-current="page"
    And both Symptoms and Positions tabs should be inactive

  Scenario: Active tab icon uses filled variant
    When any tab is active
    Then its Material Symbol icon should use FILL=1 (filled style)
    And inactive tab icons should use FILL=0 (outlined style)


Rule: Dark Mode

  Scenario: Dark mode activates when system preference is dark
    Given the user's OS is set to dark mode
    When the app loads
    Then the "html" element should have the "dark" class
    And backgrounds should use dark surface tokens

  Scenario: Dark mode updates if system preference changes mid-session
    Given the app is loaded in light mode
    When the user switches their OS to dark mode
    Then the app should immediately switch to dark mode without a page reload

  Scenario: Light mode remains if system preference is light
    Given the user's OS is set to light mode
    When the app loads
    Then the "html" element should NOT have the "dark" class


Rule: Offline / PWA

  Scenario: App shell loads from cache when offline
    Given the user has visited the app at least once
    When the device goes offline
    And the user opens the app
    Then the app shell (header, nav, main canvas) should load from the service worker cache

  Scenario: Symptom cards load offline after first visit
    Given the user has visited the Symptoms tab at least once
    When the device goes offline
    And the user taps the Symptoms tab
    Then symptom cards should load from cache
    And the user should NOT see the error screen

  Scenario: Position cards load offline after first visit
    Given the user has visited the Positions tab at least once
    When the device goes offline
    And the user taps the Positions tab
    Then position cards should load from cache

  Scenario: First visit with no connection shows a graceful error
    Given the user has never visited the app before
    And the device is offline
    When the app loads
    Then the user should see a clear message that a connection is needed for the first visit
    And the app should NOT show a blank white screen
