# ============================================================
# PHASE 1 — SYMPTOM GUIDE (Idea B)
# Covers: symptom list, symptom detail, severity, bookmarks,
#         IBCLC review metadata, content loading states
# ============================================================

Feature: Symptom List

  Background:
    Given the app is loaded
    And the user is on the Symptoms tab

  Scenario: Symptom cards load and display correctly
    When the symptom cards finish loading
    Then I should see at least 6 symptom cards
    And each card should display a title in plain language
    And each card should display a clinical name
    And each card should display a severity pill (green, yellow, or red)
    And each card should display a category label
    And each card should have a "View guide" action row

  Scenario: Loading skeleton shown while data fetches
    Given the network is slow
    When the Symptoms tab loads
    Then I should see skeleton cards with a breathing animation
    And I should see a loading indicator with the text "Loading symptoms…"
    And the skeleton cards should not be interactive

  Scenario: Error state shown when data fails to load
    Given the network request for bf_symptom_cards.json fails
    When the Symptoms tab loads
    Then I should see an error screen with a "Try again" button
    And I should NOT see any symptom cards
    And tapping "Try again" should retry the data fetch

  Scenario: Error state offers back button when cards were previously loaded
    Given symptom cards have loaded successfully before
    And then the user navigates away and back
    And the data fetch fails this time
    When the error screen appears
    Then I should see a "Back to symptoms" button
    And tapping it should show the previously loaded symptom list

  Scenario Outline: Severity pills are colour-coded correctly
    When I look at the card for "<symptom>"
    Then the severity pill should be "<colour>"

    Examples:
      | symptom              | colour |
      | Engorgement          | yellow |
      | Mastitis             | red    |
      | Cluster feeding      | green  |
      | Cracked nipples      | yellow |
      | Low milk supply      | yellow |

  Scenario: Cards are grouped or labelled by category
    When the symptom list is displayed
    Then cards should carry one of the following category labels:
      | Breast          |
      | Nipple          |
      | Baby Behaviour  |
      | Emotional       |


Rule: Symptom Detail

  Background:
    Given the symptom cards have loaded
    And I am on the symptom list

  Scenario: Tapping a card navigates to its detail screen
    When I tap the "Engorgement" symptom card
    Then I should see the detail screen for "Engorgement"
    And the URL should change to "/symptoms/engorgement"
    And the page title should contain "Engorgement"

  Scenario: Detail screen displays all required sections
    Given I am on the detail screen for "Engorgement"
    Then I should see:
      | Section                  |
      | Severity pill            |
      | Category badge           |
      | User-language title      |
      | Clinical name            |
      | "What this likely is"    |
      | Typical timing           |
      | Immediate relief steps   |
      | Do's and Don'ts grid     |
      | Red flags callout        |
      | Medical disclaimer       |

  Scenario: Numbered relief steps are in correct order
    Given I am on the detail screen for any symptom with relief steps
    When I view the immediate relief steps
    Then steps should be numbered starting from 1
    And steps should be sorted in ascending order without gaps

  Scenario: Red flags callout is always visible — never collapsed
    Given I am on any symptom detail screen
    Then the red flags section should be fully visible without requiring any tap or interaction
    And the red flags section should have a visually distinct left border in error colour

  Scenario: IBCLC review metadata is surfaced in the footer
    Given I am on any symptom detail screen
    And the symptom card has a non-empty "reviewed_by" field
    Then the disclaimer footer should display the reviewer's name
    And the disclaimer footer should display the review date formatted as "Month Year"

  Scenario: Browser back button returns to symptom list
    Given I navigated to the detail screen for "Engorgement" from the symptom list
    When I press the browser back button
    Then I should be back on the symptom list
    And my scroll position should be near the card I tapped

  Scenario: In-screen back button returns to symptom list
    Given I am on the detail screen for "Mastitis"
    When I tap the "Symptoms" back button at the top
    Then I should be on the symptom list screen
    And the URL should be "/symptoms"

  Scenario: Detail screen focus moves to heading on navigation
    Given I am using a keyboard or screen reader
    When I navigate to a symptom detail screen
    Then keyboard focus should move to the main heading of the detail screen
    And the heading should have tabindex="-1"


Rule: Bookmarks

  Background:
    Given the user is signed in

  Scenario: Signed-in user can bookmark a symptom card
    Given I am on the detail screen for "Cracked nipples"
    When I tap the bookmark button
    Then the bookmark button should show a filled state
    And a record should be saved to the bookmarks table with content_type "symptom" and slug "cracked-nipples"

  Scenario: Bookmarked cards appear on the Saved screen
    Given I have bookmarked "Engorgement" and "Mastitis"
    When I navigate to "/saved"
    Then I should see both "Engorgement" and "Mastitis" cards
    And tapping either card should navigate to its detail screen

  Scenario: Unsigned user sees a sign-in prompt on bookmark tap
    Given I am not signed in
    When I tap the bookmark button on any detail screen
    Then I should see a prompt to sign in
    And I should NOT be redirected away from the detail screen
