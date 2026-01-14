export interface Theme {
  id: string
  name: string
  description: string
  colors: {
    primary: string
    primaryForeground: string
    accent: string
    accentForeground: string
    gradient: string
    heroGradient: string
    buttonHover: string
    badge: string
    badgeText: string
    footer: string
    footerText: string
  }
}

export const themes: Record<string, Theme> = {
  blue: {
    id: "blue",
    name: "Ocean Blue",
    description: "Professional and trustworthy",
    colors: {
      primary: "bg-blue-600",
      primaryForeground: "text-white",
      accent: "bg-blue-100",
      accentForeground: "text-blue-800",
      gradient: "from-blue-600/10 via-blue-600/5 to-transparent",
      heroGradient: "from-blue-600/10 to-transparent",
      buttonHover: "hover:bg-blue-700",
      badge: "bg-blue-100",
      badgeText: "text-blue-700",
      footer: "bg-blue-600",
      footerText: "text-blue-100",
    },
  },
  emerald: {
    id: "emerald",
    name: "Fresh Emerald",
    description: "Natural and calming",
    colors: {
      primary: "bg-emerald-600",
      primaryForeground: "text-white",
      accent: "bg-emerald-100",
      accentForeground: "text-emerald-800",
      gradient: "from-emerald-600/10 via-emerald-600/5 to-transparent",
      heroGradient: "from-emerald-600/10 to-transparent",
      buttonHover: "hover:bg-emerald-700",
      badge: "bg-emerald-100",
      badgeText: "text-emerald-700",
      footer: "bg-emerald-600",
      footerText: "text-emerald-100",
    },
  },
  violet: {
    id: "violet",
    name: "Royal Violet",
    description: "Elegant and luxurious",
    colors: {
      primary: "bg-violet-600",
      primaryForeground: "text-white",
      accent: "bg-violet-100",
      accentForeground: "text-violet-800",
      gradient: "from-violet-600/10 via-violet-600/5 to-transparent",
      heroGradient: "from-violet-600/10 to-transparent",
      buttonHover: "hover:bg-violet-700",
      badge: "bg-violet-100",
      badgeText: "text-violet-700",
      footer: "bg-violet-600",
      footerText: "text-violet-100",
    },
  },
  rose: {
    id: "rose",
    name: "Soft Rose",
    description: "Warm and friendly",
    colors: {
      primary: "bg-rose-500",
      primaryForeground: "text-white",
      accent: "bg-rose-100",
      accentForeground: "text-rose-800",
      gradient: "from-rose-500/10 via-rose-500/5 to-transparent",
      heroGradient: "from-rose-500/10 to-transparent",
      buttonHover: "hover:bg-rose-600",
      badge: "bg-rose-100",
      badgeText: "text-rose-700",
      footer: "bg-rose-500",
      footerText: "text-rose-100",
    },
  },
  amber: {
    id: "amber",
    name: "Golden Amber",
    description: "Energetic and playful",
    colors: {
      primary: "bg-amber-500",
      primaryForeground: "text-white",
      accent: "bg-amber-100",
      accentForeground: "text-amber-800",
      gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
      heroGradient: "from-amber-500/10 to-transparent",
      buttonHover: "hover:bg-amber-600",
      badge: "bg-amber-100",
      badgeText: "text-amber-700",
      footer: "bg-amber-500",
      footerText: "text-amber-100",
    },
  },
  teal: {
    id: "teal",
    name: "Coastal Teal",
    description: "Fresh and modern",
    colors: {
      primary: "bg-teal-600",
      primaryForeground: "text-white",
      accent: "bg-teal-100",
      accentForeground: "text-teal-800",
      gradient: "from-teal-600/10 via-teal-600/5 to-transparent",
      heroGradient: "from-teal-600/10 to-transparent",
      buttonHover: "hover:bg-teal-700",
      badge: "bg-teal-100",
      badgeText: "text-teal-700",
      footer: "bg-teal-600",
      footerText: "text-teal-100",
    },
  },
  slate: {
    id: "slate",
    name: "Modern Slate",
    description: "Sleek and professional",
    colors: {
      primary: "bg-slate-800",
      primaryForeground: "text-white",
      accent: "bg-slate-100",
      accentForeground: "text-slate-800",
      gradient: "from-slate-800/10 via-slate-800/5 to-transparent",
      heroGradient: "from-slate-800/10 to-transparent",
      buttonHover: "hover:bg-slate-900",
      badge: "bg-slate-100",
      badgeText: "text-slate-700",
      footer: "bg-slate-800",
      footerText: "text-slate-200",
    },
  },
  orange: {
    id: "orange",
    name: "Sunset Orange",
    description: "Bold and vibrant",
    colors: {
      primary: "bg-orange-500",
      primaryForeground: "text-white",
      accent: "bg-orange-100",
      accentForeground: "text-orange-800",
      gradient: "from-orange-500/10 via-orange-500/5 to-transparent",
      heroGradient: "from-orange-500/10 to-transparent",
      buttonHover: "hover:bg-orange-600",
      badge: "bg-orange-100",
      badgeText: "text-orange-700",
      footer: "bg-orange-500",
      footerText: "text-orange-100",
    },
  },
}

export function getTheme(themeId: string): Theme {
  return themes[themeId] || themes.blue
}

export const themeOptions = Object.values(themes).map((theme) => ({
  id: theme.id,
  name: theme.name,
  description: theme.description,
}))
