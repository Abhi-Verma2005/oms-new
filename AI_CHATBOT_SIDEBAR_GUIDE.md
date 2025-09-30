# AI Chatbot Sidebar – Implementation Guide

This guide explains how the `AIChatbotSidebar` works, how it’s used, and how to extend it.

## What is it?
A slide-in chat assistant that can:
- Display and send messages
- Call a backend AI endpoint for replies
- Execute “tools” (actions) encoded in the AI’s response

File: `components/ai-chatbot-sidebar.tsx`
Used in: `components/resizable-layout.tsx`

```7:99:components/resizable-layout.tsx
import { AIChatbotSidebar } from './ai-chatbot-sidebar'
...
<AIChatbotSidebar onClose={handleSidebarToggle} />
```

## High-Level Flow
1. User types a message, clicks Send.
2. Sidebar calls `POST /api/ai-chat` with message, chat history, URL, and cart state.
3. API responds with a `response` string (may include tool tags like `[NAVIGATE:/orders]`).
4. Sidebar:
   - Strips tool tags from the text and displays the clean message.
   - Executes each tool action (navigate, view cart, etc.).

## Important Pieces
- State & Context
  - Uses `useChat()` for messages
  - Uses `useCart()` for cart ops
  - Uses `useRouter()` for navigation

- Send Flow
  - Function: `sendMessage()`
  - Sends payload to `/api/ai-chat`:
    - `{ message, messages, config, currentUrl, cartState }`
  - Then calls `processAIResponse(response, cartStateFromAPI)`

- Parsing Tools
  - Function: `processAIResponse()`
  - Detects actions using regex patterns like:
    - `[NAVIGATE:/path]`
    - `[FILTER:queryString]`
    - `[ADD_TO_CART:id]` / `[REMOVE_FROM_CART:id]`
    - `[VIEW_CART]`, `[CLEAR_CART]`, `[CART_SUMMARY]`
    - `[PROCEED_TO_CHECKOUT]`, `[VIEW_ORDERS]`
    - `[PAYMENT_SUCCESS:msg]`, `[PAYMENT_FAILED:msg]`
    - `[ORDER_DETAILS:id]`
    - `[RECOMMEND:criteria]`, `[SIMILAR_ITEMS:item]`, `[BEST_DEALS]`

- Executing Tools
  - Function: `executeAction({ type, data }, apiCartState?)`
  - Examples:
    - `navigate` → `router.push(data)`
    - `viewCart` → `openCart()`
    - `clearCart` → `clearCart()`
    - `cartSummary` → builds readable summary using API cart or local cart
    - `proceedToCheckout` → checks items > 0, then `router.push('/checkout')`
    - `orderDetails` → `router.push('/orders')`

## How “Tools” Work
- Tools are just command tags inside AI text, e.g. `[NAVIGATE:/orders]`.
- The sidebar:
  1) Finds them with regex,
  2) Removes them from the visible text,
  3) Runs the matching action in `executeAction`.

### Adding a New Tool
1. Add a new regex in `actionPatterns` inside `processAIResponse`:
   ```ts
   { pattern: /\[OPEN_HELP\]/g, type: 'openHelp' }
   ```
2. Handle it in `executeAction`:
   ```ts
   case 'openHelp':
     router.push('/help')
     break
   ```
3. The AI can now trigger it by outputting `[OPEN_HELP]`.

## API Contract
- Endpoint: `POST /api/ai-chat`
- Request body:
  - `message`: string (user input)
  - `messages`: prior chat history
  - `config`: optional AI config
  - `currentUrl`: window location for context
  - `cartState`: `{ items, totalItems, totalPrice }`
- Response body:
  - `response`: AI text (may include tool tags)
  - `cartState`: optional updated cart state

## Key UX Details
- Auto-scrolls on new messages
- Cleanly separates human text from tool commands
- Gracefully handles errors with a friendly message

## Extending the Assistant
- Persist history: store `messages` in local storage or DB.
- Enrich cart ops: implement product/site lookups for real add/remove.
- Add business tools: `[TOGGLE_DARK_MODE]`, `[OPEN_ACCOUNT_SETTINGS]`, etc.

## Quick Code Landmarks
- Component entry:
  - `export function AIChatbotSidebar({ onClose }: AIChatbotSidebarProps)`
- Send message:
  - `sendMessage()`
- Parse & run tools:
  - `processAIResponse()` → `executeAction()`

That’s it! You now know how the sidebar talks to the backend, parses tool commands, and performs real actions in the app. To build more features, add a regex → handle in `executeAction` → prompt the AI to use your new tag.
