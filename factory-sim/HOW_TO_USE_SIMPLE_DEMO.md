# HOW TO USE THE SIMPLE DEMO

## What You Should See

When the app opens, you'll see buttons at the **TOP RIGHT** of the window:

```
[🎯 Simple Demo] [Document to DES] [Editable DES] [CSV Analysis] [Visual Builder]
```

## Step-by-Step Instructions

### 1. Click "🎯 Simple Demo" Button
- Look at the TOP RIGHT corner
- Click the button that says "🎯 Simple Demo"
- It should be highlighted in blue when active

### 2. You'll See the Demo Page
After clicking, you should see:

```
🎯 SIMPLE DES DEMO - WORKING EXAMPLE

[START]  [STOP]  [RESET]     Time: 0.00

┌─────────────────┬─────────────────┬─────────────────┐
│ Entities Created│   In System     │    Departed     │
│       0         │       0         │        0        │
└─────────────────┴─────────────────┴────────────────┘

┌────────────────────────────────────────────────────┐
│                                                    │
│  → ENTRANCE      [Ticket Counter]        EXIT →   │
│                                                    │
│  (entities will appear as colored circles)         │
│                                                    │
└────────────────────────────────────────────────────┘

This is a simple M/M/2 queue (2 servers) with random arrivals and service times.
Events in queue: 20
Status: 🔴 STOPPED
```

### 3. Click the START Button
- Click the green START button
- **Immediately** you should see:
  - Time counting up: 0.00 → 5.23 → 10.45 → ...
  - Entities Created: 0 → 1 → 2 → 3 → ...
  - Colored circles appearing on the left
  - Circles moving to the Ticket Counter
  - Numbers updating in real-time

### 4. Watch the Simulation
You'll see:
- **Colored circles** = Entities (customers)
- **Moving from left to right** = Flow through system
- **Queue forming** = When both servers are busy
- **"Ticket Counter 2/2"** = Both servers processing
- **Circles disappearing on right** = Entities departing

## Browser Console Logs

Open DevTools (Cmd+Option+I or F12) and check the Console tab.

You should see logs like:
```
[SimpleDESDemo] Initializing simulation...
[SimpleDESDemo] Scheduled 20 arrivals
[SimpleDESDemo] First arrival at time: 0.5623
[Time 0.56] Entity entity_0 arrives
[Time 0.56] Entity entity_0 starts service
[Time 5.23] Entity entity_1 arrives
[Time 5.23] Entity entity_1 starts service
[Time 7.45] Entity entity_0 ends service
```

## Troubleshooting

### Problem: I don't see mode switcher buttons
**Solution**: The buttons are at the TOP RIGHT corner of the window. Look for small buttons in a row.

### Problem: I see "Document to DES" page instead
**Solution**: Click the "🎯 Simple Demo" button at the top right to switch modes.

### Problem: I click START but nothing happens
**Solution**:
1. Open DevTools Console (Cmd+Option+I)
2. Look for error messages
3. Check if you see "[SimpleDESDemo] Initializing simulation..."
4. If no logs appear, the component didn't load - check browser console for errors

### Problem: The mode switcher disappeared
**Solution**: The buttons are `position: fixed` at top right. Check if they're hidden behind something. Try pressing Cmd+R to reload the app.

## What Makes This Demo Work

Unlike the complex AI extraction system, this demo:
- **Has hardcoded arrivals** - 20 entities scheduled upfront
- **No AI required** - Pure JavaScript simulation
- **Self-contained** - All logic in one file
- **Event-driven** - Proper DES with event queue
- **Real-time canvas** - Direct HTML5 canvas drawing

This proves the DES engine works. Once you confirm this runs, we can connect it to the AI extraction.

## Expected Behavior Timeline

```
Time 0.00:  Click START
Time 0.50:  First entity arrives (green circle appears)
Time 0.50:  Entity starts processing at Ticket Counter
Time 5.00:  Second entity arrives
Time 5.00:  Second entity starts processing (2/2 servers busy)
Time 7.50:  First entity completes, departs (disappears right side)
Time 10.0:  Third entity arrives, joins queue (servers still busy)
Time 12.0:  Second entity completes, third starts processing
... continues until all 20 entities processed
Time 100:   Simulation complete
```

## Next Steps After Demo Works

1. Confirm entities are flowing
2. Add button to load extracted system
3. Connect SimpleDESDemo to AI extraction data
4. Replace hardcoded arrivals with extracted arrival pattern
5. Replace hardcoded resources with extracted resources
