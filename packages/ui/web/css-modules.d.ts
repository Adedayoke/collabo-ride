// CSS modules resolve to their class names (Vite builds them in the console).
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>
  export default classes
}
