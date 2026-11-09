import { Award, Undo2, Truck, ShieldCheck } from 'lucide-react';

const badges = [
  { icon: Award, label: 'Premium Quality' },
  { icon: Undo2, label: 'Easy Return' },
  { icon: Truck, label: 'National Delivery' },
  { icon: ShieldCheck, label: 'Safe Payment' },
];

export const TrustBadges = () => {
  return (
    <section className="container mx-auto px-2 md:px-4 my-3 md:my-8">
      <div className="grid grid-cols-4 gap-1 md:gap-4">
        {badges.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center justify-center gap-1 md:gap-3 bg-card border border-border rounded px-1 py-1.5 md:px-3 md:py-2 shadow-sm hover:shadow-md transition-shadow"
          >
            <Icon className="w-3.5 h-3.5 md:w-5 md:h-5 text-primary shrink-0" strokeWidth={1.5} />
            <span className="text-[8px] sm:text-[10px] md:text-sm font-semibold text-foreground leading-none whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
