# ============================================================
# PHASE 3 — AI COACH (Idea C)
# Covers: chat UI, safe message flow, retrieval sub-agent,
#         coach response grounding, save-tip, rate limiting,
#         streaming, suggested prompts
# ============================================================

Feature: Chat Screen

  Background:
    Given the user has tapped the Coach tab
    And the chat screen has loaded

  Scenario: Chat screen renders correctly on first open
    Then I should see:
      | Element                             |
      | Empty state with icon               |
      | "AI coach — coming soon" badge      |
      | Heading "Ask anything about..."     |
      | 3 suggested prompt chips            |
      | Text input area                     |
      | Send button (disabled)              |

  Scenario: Send button is disabled when input is empty
    Given the chat input is empty
    Then the send button should be disabled
    And it should not be tappable

  Scenario: Send button enables when user types
    When I type "how long should a feed last"
    Then the send button should become enabled

  Scenario: Textarea grows with content up to a max height
    When I type a message long enough to exceed one line
    Then the textarea should grow in height to accommodate the text
    And it should stop growing at 6 lines (96px max-height)
    And it should scroll internally beyond that

  Scenario: Pressing Enter sends the message
    Given I have typed "how long should a feed last"
    When I press Enter (not Shift+Enter)
    Then the message should be submitted
    And the input should clear

  Scenario: Pressing Shift+Enter adds a newline without sending
    Given I have typed "first line"
    When I press Shift+Enter
    Then a newline should be inserted in the input
    And the message should NOT be submitted

  Scenario: Tapping a suggested prompt chip pre-fills the input
    When I tap the chip "My baby keeps slipping off during a feed"
    Then the input should contain "My baby keeps slipping off during a feed"
    And the send button should be enabled
    And the chip should not auto-submit — the user decides when to send

  Scenario: Empty state disappears after the first message is sent
    Given the chat is in the empty state
    When I submit a message
    Then the empty state block should be removed from the DOM
    And my message should appear as a user bubble


Rule: Safe Message Flow — Coach Agent

  Background:
    Given the safety gate has passed (isSafeToCoach returns true)
    And the chat API at /api/chat is available

  Scenario: Safe message sends a request to /api/chat
    When I submit "how do I know if baby is getting enough milk"
    Then a POST request should be made to "/api/chat"
    And the request body should contain:
      | Field    | Description                          |
      | message  | The user's input                     |
      | history  | Array of prior turn messages         |

  Scenario: Coach response is grounded in Sanity content
    Given the retrieval sub-agent finds relevant content for the query
    When the coach agent responds
    Then the response should reference information from the retrieved Sanity cards
    And the response should NOT include invented medical facts
    And the response should NOT state specific medication names or dosages

  Scenario: Coach response streams to the UI
    Given I submitted a safe message
    When the /api/chat response begins streaming
    Then text should appear in the coach bubble progressively
    And the user should NOT see a blank state while waiting for the full response

  Scenario: Coach response appears as a coach bubble
    When the API responds
    Then the response text should appear in a left-aligned coach bubble
    And it should be visually distinct from my user bubble

  Scenario: Conversation history is sent with each message
    Given I have already sent 2 messages and received 2 responses
    When I send a 3rd message
    Then the /api/chat request body should contain all prior turns in the history array

  Scenario: Coach defers to IBCLC for out-of-scope questions
    Given I ask something outside the breastfeeding domain
    When the coach agent responds
    Then the response should include a suggestion to consult an IBCLC or doctor
    And it should NOT fabricate an answer on a topic outside its scope

  Scenario: Coach response does not include raw JSON or system prompt content
    When the coach agent responds to any message
    Then the response body visible to the user should contain only natural language
    And it should NOT expose system prompt content or Sanity document IDs


Rule: Retrieval Sub-Agent

  Scenario: Retrieval sub-agent is called before the coach agent
    Given a safe message is submitted
    Then the retrieval sub-agent must run first
    And its output (relevant Sanity content) must be included in the coach agent's system prompt

  Scenario: Retrieval returns position content for position-related queries
    Given I ask "which position is best for C-section recovery"
    When the retrieval sub-agent runs
    Then it should return content from the Football Hold position card
    And this content should be visible in the system prompt sent to Claude

  Scenario: Retrieval returns symptom content for symptom-related queries
    Given I ask "why does my baby feed for only 5 minutes and pull off"
    When the retrieval sub-agent runs
    Then it should return relevant symptom card content (e.g., latch issues, fast letdown)

  Scenario: Retrieval is limited to top 3 results
    Given the retrieval sub-agent finds 8 matching content blocks
    Then only the top 3 most relevant should be passed to the coach agent
    And the remaining 5 should be discarded to keep context tight

  Scenario: Retrieval failure degrades gracefully
    Given the Sanity API is unavailable
    When the retrieval sub-agent fails
    Then the coach agent should still respond with a fallback message
    And the fallback should tell the user to browse the positions or symptoms tabs
    And it should NOT throw an unhandled error


Rule: Save Tip

  Background:
    Given the user is signed in
    And a coach response has been received

  Scenario: "Save this tip" button is shown on each coach message
    When a coach bubble appears
    Then a "Save this tip" button should be visible on or below it

  Scenario: Tapping "Save this tip" saves to Supabase
    When I tap "Save this tip" on a coach response
    Then a record should be inserted into the saved_tips table with:
      | Field       | Value                         |
      | user_id     | current user's UUID           |
      | message_text| the coach response text       |
      | created_at  | current timestamp             |
    And the button should change to a "Saved" confirmed state

  Scenario: Saved tips appear on the /saved screen
    Given I have saved 2 coach tips
    When I navigate to "/saved"
    Then both saved tips should appear alongside any bookmarked cards
    And each tip should show the tip text and the date it was saved

  Scenario: Unsigned user sees sign-in prompt on "Save this tip"
    Given I am not signed in
    When I tap "Save this tip"
    Then I should see a prompt to sign in
    And the tip text should be preserved in local state so it can be saved after sign-in

  Scenario: Duplicate save is prevented
    Given I have already saved a specific coach response
    When I tap "Save this tip" on the same response again
    Then no duplicate record should be inserted
    And the button should remain in the "Saved" state


Rule: Rate Limiting

  Background:
    Given rate limiting is enforced at 20 messages per user per day
    And the user is signed in

  Scenario: User within limit can send messages normally
    Given the user has sent 15 messages today
    When they send another message
    Then the message should be processed normally
    And the API should respond without a rate limit error

  Scenario: User at the limit sees a clear message
    Given the user has sent exactly 20 messages today
    When they try to send a 21st message
    Then the /api/chat endpoint should return a 429 status
    And the UI should show "You've reached today's limit — come back tomorrow"
    And the send button should be disabled for the rest of the day

  Scenario: Rate limit resets at midnight
    Given the user hit the 20 message limit today
    When midnight passes and a new calendar day begins
    Then the user should be able to send messages again
    And their daily count should reset to 0

  Scenario: Rate limit is per user, not per device
    Given the user hit the limit on their phone
    When they open the app on their tablet with the same account
    Then they should still see the rate limit message
    And they should NOT be able to bypass the limit by switching devices

  Scenario: Unauthenticated users cannot access /api/chat
    Given I am not signed in
    When I try to POST to "/api/chat"
    Then the API should return a 401 Unauthorized response
    And the UI should prompt me to sign in to use the coach
