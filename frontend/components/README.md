# components/

**WHY:** React components are the building blocks of the UI.

**WHAT:** This folder will be organized by feature:

```
components/
├── canvas/           - Main canvas and shape rendering
│   ├── Canvas.tsx
│   ├── Shape.tsx
│   ├── SelectionBox.tsx
│   └── Grid.tsx
├── toolbar/          - Top toolbar with tools and shape buttons
│   ├── Toolbar.tsx
│   └── ToolButton.tsx
├── properties/       - Properties panel for editing shapes
│   └── PropertiesPanel.tsx
├── presence/         - Multiplayer cursors and user list
│   ├── CursorOverlay.tsx
│   └── PresenceList.tsx
├── ai/              - AI assistant interface
│   └── AIPanel.tsx
└── auth/            - Login/signup forms
    ├── LoginForm.tsx
    └── SignupForm.tsx
```

**KEY PRINCIPLES:**
- Keep components small and focused
- Use TypeScript for props
- Export components with clear names

