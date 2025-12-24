import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFire } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';

interface FireMeterProps {
  level: number;
  max?: number;
  className?: string;
}

export function FireMeter({ level, max = 3, className }: FireMeterProps) {
  return (
    <div className={cn("heat-meter flex items-center", className)}>
      {Array.from({ length: max }).map((_, index) => (
        <FontAwesomeIcon
          key={index}
          icon={faFire}
          className={cn(
            "mr-1",
            index < level ? "text-accent" : "text-gray-300"
          )}
        />
      ))}
      <span className="text-sm text-gray-500 ml-1">
        {level === 1 && "Mild Heat"}
        {level === 2 && "Medium Heat"}
        {level === 3 && "Extra Hot"}
      </span>
    </div>
  );
}
