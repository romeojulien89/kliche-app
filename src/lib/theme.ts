export type ThemeMode = "auto" | "clair" | "sombre";

export const THEME_STORAGE_KEY = "kliche-theme";

export function isDarkForMode(mode: ThemeMode): boolean {
  if (mode === "sombre") return true;
  if (mode === "clair") return false;
  const hour = new Date().getHours();
  return hour < 6 || hour >= 18;
}

export function applyTheme(mode: ThemeMode): void {
  document.documentElement.classList.toggle("dark", isDarkForMode(mode));
}

export const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem("${THEME_STORAGE_KEY}")||"auto";var d;if(m==="sombre")d=true;else if(m==="clair")d=false;else{var h=new Date().getHours();d=h<6||h>=18;}if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

// Petit store externe pour lire/écrire le thème sans provoquer de mismatch
// d'hydratation : useSyncExternalStore rend getServerSnapshot() côté serveur
// ET lors du premier rendu client (avant hydratation), puis bascule sur
// getSnapshot() après coup — sans setState dans un effet (interdit ici par
// la règle ESLint react-hooks/set-state-in-effect, voir CLAUDE.md).
type Listener = () => void;
let listeners: Listener[] = [];

function emitThemeChange(): void {
  for (const listener of listeners) listener();
}

export function subscribeThemeMode(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getStoredThemeMode(): ThemeMode {
  return (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null) ?? "auto";
}

export function getServerThemeMode(): ThemeMode {
  return "auto";
}

export function setStoredThemeMode(mode: ThemeMode): void {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  emitThemeChange();
}
