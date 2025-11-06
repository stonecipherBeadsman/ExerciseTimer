# Exercise Timer

A single-page workout companion built entirely in HTML, CSS, and vanilla JavaScript. The app lets you import, build, reorder, and run a custom sequence of timed or repetition-based exercises while providing speech guidance and countdown cues.

## Opening the App

1. Open `exerciseTimer2.html` in a modern browser (Chrome, Edge, Safari, or Firefox).
2. Allow speech synthesis access if prompted so the app can announce exercises and countdown alerts.

No build tools or servers are required—the file can be opened directly from disk.

## Core Features

- **Visual timer panel** with large time display, current movement indicator, and marquee animation for long exercise names.
- **Workout editor** that supports manual entry, bulk import (`Name|Duration|Reps`) and drag-and-drop reordering.
- **Status tracking** that collapses completed items and marks them as completed ✓ or failed ✗ based on user input.
- **Speech guidance** that announces each movement, provides countdown warnings at 30, 20, and 10 seconds, and prompts for repetition counts when needed.
- **Clipboard export** to share the configured routine.

## Function Reference

The JavaScript embedded in `exerciseTimer2.html` is organized into small functions that each manage a specific piece of behavior:

| Function | Purpose |
| --- | --- |
| `toggleCollapsible(section)` | Expands or collapses the import/build/export panels by toggling the `collapsed` class. |
| `updateButtonStates()` | Enables or disables the start, pause, and stop buttons based on workout contents and completion state. |
| `addExerciseListItem(name, duration, reps)` | Creates a list entry for an exercise, attaches drag-and-drop handlers, and wires up the per-item collapse control. |
| `exportWorkoutToClipboard()` | Serializes the workout to `Name|Duration|Reps` format and copies it using the Clipboard API or a textarea fallback. |
| `fallbackCopyText(str)` | Implements the legacy copy-to-clipboard flow for browsers without the async Clipboard API. |
| `renderWorkoutList()` | Rebuilds the visible workout list from the in-memory `workout` array (used on restarts). |
| `addExercisesFromString()` | Parses a comma-separated input string from the Import panel and appends the resulting exercises to the routine. |
| `handleDragStart(e)` | Caches the dragged item and stores its HTML so the element can be recreated on drop. |
| `handleDragOver(e)` | Enables dropping by preventing default behavior and styling the target while an item is hovered. |
| `handleDrop(e)` | Re-inserts the dragged exercise before the drop target, rebinds drag handlers, and synchronizes the `workout` array order. |
| `updateWorkoutArray()` | Reads the list DOM after a drag event and rebuilds the `workout` array to reflect the new order. |
| `updateDisplay(seconds)` | Formats a `mm:ss` string and updates the timer readout. |
| `speak(text)` | Uses the browser's Speech Synthesis API to vocalize prompts if available. |
| `pauseOrResumeWorkout()` | Toggles the paused state, updates button text, and either resumes counting down or stops the active timer. |
| `stopWorkout()` | Cancels the timer, resets the display and speech queue, and returns the UI to the ready state. |
| `handleStartOrRestart()` | Starts a new workout run or resets state when a routine has finished. |
| `startWorkout()` | Orchestrates the full workout sequence, including speech prompts, auto-scrolling, and branching for timed, repetition, or instruction items. |
| `startTimer(seconds, callback)` | Runs the countdown, issues speech alerts at key intervals, and triggers the supplied callback when the timer completes. |

Event listeners also wire the **Add Exercise** form (`submit`) and the control buttons (`Start`, `Pause/Resume`, `Stop`) to their respective behaviors, while the nested `nextExercise` helper inside `startWorkout` advances through the routine.

## Usage Tips

- Enter timed exercises by providing a duration in seconds; leave reps blank for timed intervals.
- Enter repetition-based movements by specifying reps; leave duration blank so the app can prompt for actual reps completed.
- Add instruction-only items by providing just a name (no duration or reps). The app will announce the instruction and immediately continue.
- Use the drag handles (anywhere on the item) to reorder exercises before starting or between sessions.
- After finishing a workout, press **Restart Workout** to reset the list state while keeping the same sequence.

## Export Format

The exported string is a comma-separated list where each exercise is formatted as:

```
Name|Duration|Reps
```

Omitted values (no duration or no reps) are simply left blank when importing or exporting.

## Accessibility & Browser Support

- Relies on the Web Speech API (`window.speechSynthesis`); browsers that lack this feature will silently skip voice prompts.
- Uses standard HTML5 drag-and-drop events, which work best on desktop browsers.
- The responsive layout hides the page title and enlarges the timer on small screens to keep the focus on the active movement.

