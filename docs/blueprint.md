# Crypto Tracker Bot — Bot specification

**Archetype:** custom

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

A personal Telegram bot that lets users track crypto prices and receive configurable alerts. Users maintain private watchlists, set threshold and percentage-based alerts, request on-demand prices, and opt into a morning summary. The bot enforces quiet hours and alert cooldowns to avoid spam, and retries failed price feeds silently. The owner receives usage and alert-statistics reports.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- Individual Telegram users who want private, low-noise crypto price alerts and quick price checks.

## Success criteria

- Users can add/remove coins to their watchlist and receive alerts based on thresholds or percentage changes.
- Users can request on-demand prices for specific coins or their entire watchlist.
- The bot enforces quiet hours and alert cooldowns to avoid spam.
- The owner receives periodic reports with active user count and top-fired alerts.

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open the main menu and explain features, ask for timezone permission
- **Add coin** (button, actor: user, callback: add_coin:start) — Open the Add coin flow with buttons for common tickers and free-text entry
  - inputs: ticker, nickname
  - outputs: watchlist item added
- **Remove coin** (button, actor: user, callback: remove_coin:start) — Open the Remove coin flow with a list of current watchlist items
  - inputs: ticker
  - outputs: watchlist item removed
- **View list** (button, actor: user, callback: view_list:start) — Display the user's current watchlist with options to edit or remove items
  - inputs: none
  - outputs: watchlist displayed
- **/price** (command, actor: user, command: /price) — Request current price for a specific coin or all coins on the watchlist
  - inputs: ticker or 'all'
  - outputs: price information with percent change if available
- **Set alert** (button, actor: user, callback: set_alert:start) — Open the Set alert flow to configure price threshold or percentage-based alerts
  - inputs: ticker, alert type, threshold, timeframe
  - outputs: alert record created
- **Configure summary** (button, actor: user, callback: configure_summary:start) — Set or adjust the morning summary time and opt-in/out
  - inputs: local time, opt-in/out
  - outputs: summary settings updated
- **Set quiet hours** (button, actor: user, callback: set_quiet_hours:start) — Configure start and end times for quiet hours
  - inputs: start time, end time
  - outputs: quiet hours settings updated

## Flows

### Onboarding
_Trigger:_ /start

1. Explain features
2. Ask for timezone permission
3. Detect or ask for timezone

_Data touched:_ User profile

### Add coin
_Trigger:_ add_coin:start

1. Show buttons for common tickers (BTC, ETH, TON)
2. Allow free-text ticker entry
3. Optionally set nickname
4. Add to watchlist

_Data touched:_ Watchlist item

### Remove coin
_Trigger:_ remove_coin:start

1. List current watchlist items
2. Select coin to remove
3. Confirm removal

_Data touched:_ Watchlist item

### Set alert
_Trigger:_ set_alert:start

1. Select coin from watchlist
2. Choose alert type (threshold or percentage)
3. Set threshold or percentage and timeframe
4. Confirm alert settings

_Data touched:_ Alert record

### Price check
_Trigger:_ /price

1. Request ticker or 'all'
2. Fetch current price
3. Display price with percent change if available

_Data touched:_ Watchlist item, Alert record

### Morning summary
_Trigger:_ scheduled event

1. Check if user has opted in
2. Fetch prices for all watchlist items
3. Summarize movements
4. Send summary message

_Data touched:_ User profile, Watchlist item, Alert record

### Alert delivery
_Trigger:_ price threshold or percentage change

1. Check if alert is active
2. Check if within quiet hours
3. Send alert message
4. Mark alert as fired and apply cooldown

_Data touched:_ Alert record, User profile

### Error handling
_Trigger:_ unknown ticker or typo

1. Display error message
2. Suggest similar tickers
3. Offer retry option

_Data touched:_ none

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **User profile** _(retention: persistent)_ — Stores user-specific settings and preferences
  - fields: chat id, timezone, quiet hours start, quiet hours end, morning summary time, cooldown settings
- **Watchlist item** _(retention: persistent)_ — Represents a coin in the user's watchlist
  - fields: ticker, nickname, alerts
- **Alert record** _(retention: persistent)_ — Tracks alert definitions and firing history
  - fields: coin, alert type, threshold, timeframe, old price, new price, percent change, timestamp, fired flag, cooldown until

## Integrations

- **Telegram** (required) — Bot API messaging
- **Crypto price API** (required) — Fetch current and historical price data
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Configure report cadence (daily summary + weekly top-alerts)
- Set up admin chat ID for reports
- Adjust default alert cooldown duration
- Set retry attempts for price feed failures

## Notifications

- Price alerts with coin, old price, new price, percent change, alert type, and timestamp
- Morning summary of watchlist movements
- Owner reports with active user count and top-fired alerts

## Permissions & privacy

- User data is stored privately and not shared
- Watchlists and alerts are user-specific and not visible to others
- User can opt out of morning summaries at any time

## Edge cases

- User enters an unknown ticker or typo
- Alert fires during quiet hours and needs to be delayed
- Price feed failure requires silent retry
- Multiple alerts for the same coin within cooldown period

## Required tests

- Verify that users can add/remove coins to their watchlist and receive alerts
- Test that price checks return current prices with percent change
- Ensure quiet hours and cooldowns prevent alert spam
- Validate that owner reports show accurate user count and top alerts

## Assumptions

- Timezone detection will use Telegram profile if available
- Default monitored tickers are BTC, ETH, TON
- Percentage alert timeframe defaults to 1 hour
- Alert cooldown defaults to 6 hours per fired alert per user-coin-alert combination
- Retry behavior on price feed failure is 3 silent retries with backoff
