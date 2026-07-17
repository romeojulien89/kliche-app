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
