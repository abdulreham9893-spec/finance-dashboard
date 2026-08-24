import type { CSSProperties } from "react";
import {
  Wallet,
  Briefcase,
  TrendingUp,
  Plus,
  Home,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Film,
  Heart,
  GraduationCap,
  Landmark,
  MoreHorizontal,
  PiggyBank,
  Laptop,
  Plane,
  ArrowLeftRight,
  Target,
  Dumbbell,
  Gift,
  Building2,
  Music,
  Gamepad2,
  Coffee,
  Tag,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Wallet,
  Briefcase,
  TrendingUp,
  Plus,
  Home,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Film,
  Heart,
  GraduationCap,
  Landmark,
  MoreHorizontal,
  PiggyBank,
  Laptop,
  Plane,
  ArrowLeftRight,
  Target,
  Dumbbell,
  Gift,
  Building2,
  Music,
  Gamepad2,
  Coffee,
};

export function CategoryIcon({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
}) {
  const Icon = ICON_MAP[name] ?? Tag;
  return <Icon className={className} style={style} />;
}