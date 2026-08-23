# Frontend conventions

- Use `src/components/MainStringInput.tsx` for every user-entered text, search, email, password, URL, telephone, number, date, time, and datetime input.
- Keep native `<input>` elements only for specialized controls that `MainStringInput` must not wrap: file, checkbox, radio, color, range, and hidden inputs.
- When sanitizing profile social values, pass every change through `toAsciiAlnumPassword()` before storing it.
- Use `src/components/HoverDiv.tsx` for interactive buttons. Choose its `type` color scheme and pass SVGs through `icon`; use aliases such as `SaveButton` and `DeleteButton` for standard actions.
