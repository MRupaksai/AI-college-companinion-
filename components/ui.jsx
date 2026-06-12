"use client";

export function Card({ children, className = "" }) {
  return (
    <div className={`glass rounded-2xl p-5 shadow-xl shadow-black/20 animate-fade-in ${className}`}>
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  type = "button",
  className = "",
}) {
  const variants = {
    primary: "bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/25",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-100",
    danger: "bg-red-600/80 hover:bg-red-500 text-white",
    ghost: "bg-transparent hover:bg-slate-700/50 text-slate-300",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({ label, ...props }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm text-slate-400">{label}</span>}
      <input
        {...props}
        className={`w-full rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${props.className ?? ""}`}
      />
    </label>
  );
}

export function Select({ label, children, ...props }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm text-slate-400">{label}</span>}
      <select
        {...props}
        className={`w-full rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${props.className ?? ""}`}
      >
        {children}
      </select>
    </label>
  );
}

export function Textarea({ label, ...props }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm text-slate-400">{label}</span>}
      <textarea
        {...props}
        className={`w-full rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${props.className ?? ""}`}
      />
    </label>
  );
}

export function Badge({ children, color = "indigo" }) {
  const colors = {
    indigo: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    green: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    amber: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    red: "bg-red-500/20 text-red-300 border-red-500/30",
    slate: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  };

  return (
    <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, max = 100 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color = pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-700">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 text-4xl opacity-40">📚</div>
      <h3 className="text-lg font-medium text-slate-200">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
  );
}
