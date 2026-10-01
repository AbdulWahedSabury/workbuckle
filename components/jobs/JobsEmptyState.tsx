import { Briefcase } from "lucide-react";
import { motion } from "framer-motion";

export function JobsEmptyState({ filterName }: { filterName?: string }) {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center justify-center gap-4 rounded-xl border border-line bg-card/60 p-8 text-center"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Briefcase className="h-5 w-5" />
      </div>
      <div className="text-left">
        <p className="text-sm font-medium text-foreground">
          No positions currently listed {filterName && filterName !== "All" ? `in ${filterName}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          Try selecting a different location tab above.
        </p>
      </div>
    </motion.div>
  );
}