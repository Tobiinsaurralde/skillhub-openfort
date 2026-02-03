import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  title: string;
  icon: LucideIcon;
  color: string;
}

const CategoryCard = ({ title, icon: Icon, color }: CategoryCardProps) => {
  return (
    <Link
      to={`/browse?category=${encodeURIComponent(title)}`}
      className="group relative overflow-hidden rounded-lg border bg-card p-6 transition-all hover:shadow-lg"
      style={{ borderTopColor: color, borderTopWidth: "3px" }}
    >
      <div className="flex items-center space-x-4">
        <div
          className="rounded-lg p-3"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
        <div>
          <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
