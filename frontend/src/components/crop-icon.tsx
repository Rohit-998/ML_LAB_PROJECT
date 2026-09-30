import { Apple, Banana, Bean, Cherry, Citrus, Coffee, Grape, Leaf, Shrub, Sprout, TreePalm, Wheat, type LucideProps } from "lucide-react";

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  apple: Apple, banana: Banana, coconut: TreePalm, coffee: Coffee, grapes: Grape, orange: Citrus,
  pomegranate: Cherry, mango: Leaf, papaya: Leaf, muskmelon: Citrus, watermelon: Citrus,
  rice: Wheat, maize: Wheat, jute: Shrub, cotton: Shrub,
  blackgram: Bean, chickpea: Bean, kidneybeans: Bean, lentil: Bean, mothbeans: Bean, mungbean: Bean, pigeonpeas: Bean,
};

export function CropIcon({ crop, ...props }: { crop: string } & LucideProps) {
  const Icon = ICONS[crop] ?? Sprout;
  return <Icon aria-hidden="true" {...props} />;
}
