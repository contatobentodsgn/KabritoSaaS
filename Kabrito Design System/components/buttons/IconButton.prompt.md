Icon-only control — toolbar actions, close buttons, media controls. Always pass `ariaLabel`.

```jsx
<IconButton ariaLabel="Configurações" variant="ghost"><i data-lucide="settings"></i></IconButton>
<IconButton ariaLabel="Adicionar" variant="primary" shape="circle"><i data-lucide="plus"></i></IconButton>
```

Variants mirror `Button`. Use `shape="circle"` for floating/media controls, `rounded` inside toolbars.
