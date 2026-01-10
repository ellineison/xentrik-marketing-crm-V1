
import React from "react";

interface Props {
  teams: { label: string; value: string }[];
  selected: string[];
  onChange: (value: string) => void;
}

const TeamsSection: React.FC<Props> = ({ teams, selected, onChange }) => (
  <div className="bg-card/50 p-6 rounded-xl border border-border/50">
    <h2 className="text-xl font-bold mb-4 text-foreground">Teams</h2>
    <div className="grid grid-cols-3 gap-3">
      {teams.map((team) => (
        <label
          key={team.value}
          className={`flex items-center gap-2 rounded-md border p-3 cursor-pointer transition-all ${
            selected.includes(team.value)
              ? "bg-primary/20 border-primary/50"
              : "bg-muted border-border"
          }`}
        >
          <input
            type="checkbox"
            checked={selected.includes(team.value)}
            onChange={() => onChange(team.value)}
            className="accent-primary w-4 h-4"
          />
          <span className="text-foreground text-sm">{team.label}</span>
        </label>
      ))}
    </div>
  </div>
);

export default TeamsSection;
