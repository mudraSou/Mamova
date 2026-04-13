# ============================================================
# PHASE 1 — POSITIONS GUIDE (Idea A)
# Covers: position list, position detail, step-by-step cards,
#         latch checklist interactivity, common mistakes,
#         "best for" tags, "not ideal for" block
# ============================================================

Feature: Position List

  Background:
    Given the app is loaded
    And I tap the "Positions" tab in the bottom nav

  Scenario: Positions tab is enabled and tappable
    Then the Positions tab should NOT be disabled
    And tapping it should load the positions screen
    And the Positions tab should show an active (filled icon + pill) state

  Scenario: All 5 positions load and display
    When the positions data finishes loading
    Then I should see exactly 5 position cards:
      | Position Title      |
      | Cradle Hold         |
      | Cross-Cradle Hold   |
      | Football Hold       |
      | Side-Lying          |
      | Laid-Back Hold      |

  Scenario: Each position card shows the required information
    When I view any position card
    Then it should display:
      | Field             |
      | Position title    |
      | Tagline           |
      | Difficulty label  |
      | Icon              |
      | Best-for tags     |
      | "View steps" CTA  |

  Scenario Outline: Difficulty labels are human-readable
    When I view the card for "<position>"
    Then the difficulty label should read "<label>"

    Examples:
      | position          | label                |
      | Cradle Hold       | Beginner-friendly    |
      | Cross-Cradle Hold | Beginner-friendly    |
      | Football Hold     | Intermediate         |
      | Side-Lying        | Intermediate         |
      | Laid-Back Hold    | Beginner-friendly    |

  Scenario: Encouragement banner is shown at the bottom of the list
    When the positions list is fully rendered
    Then I should see an encouragement banner below the last card
    And the banner should contain a supportive message

  Scenario: Loading skeleton shown while positions data fetches
    Given the network is slow
    When the Positions tab loads
    Then I should see skeleton cards with a breathing animation
    And the skeleton cards should not be interactive

  Scenario: Error state shown when positions data fails to load
    Given the network request for bf_positions.json fails
    When the Positions tab loads
    Then I should see the error screen
    And tapping "Try again" should retry fetching bf_positions.json


Rule: Position Detail

  Background:
    Given the positions list has loaded
    And I tap the "Football Hold" card

  Scenario: Navigating to a position detail changes the URL
    Then the URL should change to "/positions/football-hold"
    And the page title should contain "Football Hold"

  Scenario: Position detail displays all required sections
    Then I should see:
      | Section                |
      | Back button            |
      | Hero block with icon   |
      | Title and tagline      |
      | Best-for tags          |
      | Step-by-step section   |
      | Latch checklist        |
      | Common mistakes        |
      | Not ideal for block    |
      | Medical disclaimer     |

  Scenario: Steps are shown in the correct order
    When I view the "Step-by-step" section
    Then steps should be numbered starting from 1
    And steps should be in ascending order without gaps
    And each step should show a title and instruction

  Scenario: Steps with tips show a tip callout
    Given a step has a non-null tip field
    When I view that step
    Then a tip callout should be visible with a lightbulb icon
    And the tip text should match the data

  Scenario: Steps without tips do not show an empty tip callout
    Given a step has a null tip field
    When I view that step
    Then no tip callout element should be rendered for that step

  Scenario: Latch checklist items are interactive
    Given I am on any position detail screen
    When I tap a latch checklist item
    Then the item should show a checked visual state (filled circle with checkmark)
    And the item text should be struck through
    And the aria-checked attribute should be set to "true"

  Scenario: Latch checklist is keyboard accessible
    Given I am using a keyboard
    When I focus a latch checklist item and press Space
    Then the item should toggle to checked
    When I press Space again
    Then the item should toggle back to unchecked

  Scenario: Latch checklist state is not persisted across sessions
    Given I checked 3 latch items on "Cradle Hold"
    When I navigate away and return to the "Cradle Hold" detail
    Then all checklist items should be unchecked

  Scenario: Common mistakes show a mistake and a fix
    When I view the "Common mistakes" section
    Then each mistake card should show:
      | Field          |
      | Mistake label  |
      | Mistake text   |
      | Fix label      |
      | Fix text       |

  Scenario: "Not ideal for" block is shown only when data exists
    Given the "Laid-Back Hold" has a non-empty not_ideal_for list
    When I view the Laid-Back Hold detail
    Then I should see the "May not suit you if…" block
    And each item should be listed

  Scenario: Best-for tags are displayed as pills
    When I view the "Football Hold" detail
    Then I should see best-for tags including "C-section recovery"
    And each tag should be styled as a pill

  Scenario: Browser back button returns to positions list
    Given I navigated to "Football Hold" from the positions list
    When I press the browser back button
    Then I should be back on the positions list
    And the URL should be "/positions"

  Scenario: Back button in screen returns to positions list
    When I tap the "Positions" back button at the top of the detail
    Then I should be on the positions list screen

  Scenario: Focus moves to detail heading on navigation
    Given I am using a keyboard or screen reader
    When I tap a position card
    Then focus should move to the "h1" of the position detail screen

  Scenario: IBCLC reviewer is shown in the disclaimer footer
    Given the position data has a non-empty disclaimer field
    When I view any position detail
    Then the footer should display the disclaimer text
