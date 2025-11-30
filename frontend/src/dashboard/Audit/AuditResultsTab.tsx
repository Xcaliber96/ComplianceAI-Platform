import React from "react";

const metrics = [
  {
    label: "Total Tasks",
    value: 0,
    description: "All tasks currently tracked in your workspace.",
    highlight: true,
  },
  {
    label: "Completed",
    value: 0,
    description: "Tasks finished and verified as complete.",
    highlight: false,
  },
  {
    label: "Overdue",
    value: 0,
    description: "Tasks that passed their due date.",
    highlight: false,
  },
  {
    label: "Breached",
    value: 0,
    description: "Tasks that breached a critical SLA or control.",
    highlight: false,
  },
];

const AuditResultsTab: React.FC = () => {
  return (
    <div className="min-h-screen text-slate-900">
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 lg:flex-row">
        
        {/* LEFT SIDE – MAIN CONTENT */}
        <div className="flex-1 space-y-8">
          
          {/* Header */}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Dashboard Summary
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              Get a quick view of total tasks, completion progress, overdue
              risk, and breached items across your workspace.
            </p>
          </div>

          {/* Step 1 – Metrics */}
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                1
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-600">
                  Overview
                </p>
                <p className="text-sm text-slate-500">
                  Review key metrics for your audit tasks.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {metrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </div>
          </section>

          {/* Step 2 – Activity */}
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                2
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-600">
                  Activity
                </p>
                <p className="text-sm text-slate-500">
                  Visualize task trends and status distribution.
                </p>
              </div>
            </div>

            <div className="h-48 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 flex items-center justify-center text-sm text-slate-400">
              Task trend / chart placeholder
            </div>
          </section>

          {/* Step 3 – Review */}
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                3
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600">
                  Review tasks
                </p>
                <p className="text-sm text-slate-500">
                  Prioritize overdue and breached tasks for follow-up.
                </p>
              </div>
            </div>

            <div className="h-40 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 flex items-center justify-center text-sm text-slate-400">
              Task list / table placeholder
            </div>
          </section>
        </div>

        {/* RIGHT SIDE – INFO PANEL */}
        <aside className="w-full space-y-4 lg:w-80">
          
          {/* Dark info card */}
          <div className="rounded-3xl bg-slate-900 p-6 text-slate-50 shadow-md">
            <h2 className="mb-2 text-sm font-semibold tracking-[0.18em] text-emerald-300">
              HOW THIS WORKS
            </h2>
            <p className="mb-4 text-sm text-slate-200">
              This dashboard aggregates task data from your audit workspace and
              surfaces the signals that need your attention.
            </p>

            <ul className="space-y-2 text-sm text-slate-200">
              <li>• Use the metrics section to assess workload and risk.</li>
              <li>• Investigate overdue and breached tasks first.</li>
              <li>• Use the activity and review sections to plan follow-ups.</li>
            </ul>
          </div>

          {/* Light next-step card */}
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Next step
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Once you're comfortable with the overview, open the detailed task
              list to assign owners, update statuses, or export reports.
            </p>

            <button className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800">
              Go to task list
            </button>
          </div>

        </aside>
      </main>
    </div>
  );
};

type MetricCardProps = {
  label: string;
  value: number;
  description: string;
  highlight?: boolean;
};

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  description,
  highlight,
}) => {
  return (
    <div
      className={[
        "flex flex-col justify-between rounded-2xl border p-4 transition",
        highlight
          ? "border-emerald-200 bg-emerald-50/70 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
          : "border-slate-200 bg-slate-50/60 hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </div>

        {highlight && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-700">
            Selected
          </span>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-500">{description}</p>
    </div>
  );
};

export default AuditResultsTab;
