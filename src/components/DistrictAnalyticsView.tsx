import React, { useState } from 'react';
import { DISTRICT_ANALYTICS_DATA } from '../data/mockData';
import { BarChart3, ShieldCheck, MapPin, Building, Globe, Lock, Filter } from 'lucide-react';

export const DistrictAnalyticsView: React.FC = () => {
  const [activeTier, setActiveTier] = useState<'District' | 'State' | 'National'>('District');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');

  // Aggregate metrics
  const totalMonitored = DISTRICT_ANALYTICS_DATA.reduce((acc, d) => acc + d.total, 0);
  const totalHighRisk = DISTRICT_ANALYTICS_DATA.reduce((acc, d) => acc + d.highRiskCount, 0);
  const totalCritical = DISTRICT_ANALYTICS_DATA.reduce((acc, d) => acc + d.critical, 0);

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-b border-[#ebebeb] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#171717]">
              District & State Governance Analytics
            </h1>
            <span className="bg-slate-100 text-[#171717] text-xs font-mono font-medium px-2.5 py-0.5 rounded border border-[#ebebeb]">
              AGGREGATED INSIGHTS
            </span>
          </div>
          <p className="text-xs text-[#8f8f8f] mt-1">
            Macro-level distress trends and resource allocation monitoring across administrative tiers.
          </p>
        </div>

        {/* Tier Switcher */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded-full border border-[#ebebeb] text-xs shadow-xs">
          <button
            onClick={() => setActiveTier('District')}
            className={`px-3 py-1.5 rounded-full font-medium transition ${
              activeTier === 'District' ? 'bg-[#171717] text-white' : 'text-[#4d4d4d] hover:text-[#171717]'
            }`}
          >
            District Tier
          </button>
          <button
            onClick={() => setActiveTier('State')}
            className={`px-3 py-1.5 rounded-full font-medium transition ${
              activeTier === 'State' ? 'bg-[#171717] text-white' : 'text-[#4d4d4d] hover:text-[#171717]'
            }`}
          >
            State Tier
          </button>
          <button
            onClick={() => setActiveTier('National')}
            className={`px-3 py-1.5 rounded-full font-medium transition ${
              activeTier === 'National' ? 'bg-[#171717] text-white' : 'text-[#4d4d4d] hover:text-[#171717]'
            }`}
          >
            National Tier
          </button>
        </div>
      </div>

      {/* Security Privacy Notice */}
      <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl flex items-center justify-between text-xs text-blue-900">
        <div className="flex items-center space-x-2">
          <Lock className="w-4 h-4 text-[#0070f3] shrink-0" />
          <span>
            <strong>Aggregated view:</strong> This page shows counts by region only. Names, trusted contacts and exact locations are not displayed here; trusted contacts are visible only to the assigned counsellor.
          </span>
        </div>
        <span className="font-mono text-[10px] bg-blue-100 text-[#0070f3] px-2 py-0.5 rounded uppercase font-semibold">
          Counts only
        </span>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-[#ebebeb] p-5 rounded-2xl shadow-xs space-y-1">
          <span className="text-[11px] font-mono uppercase text-[#8f8f8f]">Total Monitored Cases</span>
          <div className="text-3xl font-bold text-[#171717]">{totalMonitored}</div>
          <p className="text-[10px] text-[#8f8f8f]">Across 8 pilot districts</p>
        </div>

        <div className="bg-white border border-[#ebebeb] p-5 rounded-2xl shadow-xs space-y-1">
          <span className="text-[11px] font-mono uppercase text-[#8f8f8f]">High-Risk Cluster</span>
          <div className="text-3xl font-bold text-amber-700">{totalHighRisk}</div>
          <p className="text-[10px] text-amber-600">Requires active counsellor review</p>
        </div>

        <div className="bg-white border border-[#ebebeb] p-5 rounded-2xl shadow-xs space-y-1">
          <span className="text-[11px] font-mono uppercase text-[#8f8f8f]">Critical Escalations</span>
          <div className="text-3xl font-bold text-red-600">{totalCritical}</div>
          <p className="text-[10px] text-red-500">Urgent crisis intervention</p>
        </div>

        <div className="bg-white border border-[#ebebeb] p-5 rounded-2xl shadow-xs space-y-1">
          <span className="text-[11px] font-mono uppercase text-[#8f8f8f]">Interventions Pending</span>
          <div className="text-3xl font-bold text-blue-600">23</div>
          <p className="text-[10px] text-blue-500">Resource allocation queue</p>
        </div>

        <div className="bg-white border border-[#ebebeb] p-5 rounded-2xl shadow-xs space-y-1">
          <span className="text-[11px] font-mono uppercase text-[#8f8f8f]">Follow-ups Completed</span>
          <div className="text-3xl font-bold text-emerald-600">194</div>
          <p className="text-[10px] text-emerald-500">88.2% completion rate</p>
        </div>
      </div>

      {/* DISTRICT RISK COMPARISON CHART & TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* District Risk Heatmap Bar Visualizer */}
        <div className="lg:col-span-2 bg-white border border-[#ebebeb] p-6 rounded-2xl shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#ebebeb] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#171717]">District-Wise High-Risk Cluster Heatmap</h2>
              <p className="text-xs text-[#8f8f8f]">High-risk and critical case counts by district</p>
            </div>
            <span className="text-xs font-mono text-[#0070f3] font-semibold">
              {DISTRICT_ANALYTICS_DATA.length} Pilot Districts
            </span>
          </div>

          <div className="space-y-4">
            {DISTRICT_ANALYTICS_DATA.map((dist, idx) => {
              const highPercentage = (dist.highRiskCount / 25) * 100;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-[#171717]">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-[#0070f3]" />
                      <span className="font-semibold">{dist.district}</span>
                      <span className="text-[#8f8f8f] font-normal text-[11px]">({dist.state})</span>
                    </div>
                    <div className="flex items-center space-x-3 font-mono text-xs">
                      <span className="text-[#4d4d4d]">Total: {dist.total}</span>
                      <span className="text-red-600 font-bold">High Risk: {dist.highRiskCount}</span>
                    </div>
                  </div>

                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-emerald-500 rounded-l-full"
                      style={{ width: `${(dist.low / dist.total) * 100}%` }}
                      title={`Low Risk: ${dist.low}`}
                    />
                    <div 
                      className="h-full bg-yellow-400"
                      style={{ width: `${(dist.moderate / dist.total) * 100}%` }}
                      title={`Moderate Risk: ${dist.moderate}`}
                    />
                    <div 
                      className="h-full bg-amber-500"
                      style={{ width: `${(dist.high / dist.total) * 100}%` }}
                      title={`High Risk: ${dist.high}`}
                    />
                    <div 
                      className="h-full bg-red-600 rounded-r-full"
                      style={{ width: `${(dist.critical / dist.total) * 100}%` }}
                      title={`Critical Risk: ${dist.critical}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-xs text-[#8f8f8f] pt-4 border-t border-[#ebebeb]">
            <div className="flex items-center space-x-4">
              <span className="flex items-center"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-1.5"/> Low</span>
              <span className="flex items-center"><span className="w-2.5 h-2.5 bg-yellow-400 rounded-full mr-1.5"/> Moderate</span>
              <span className="flex items-center"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full mr-1.5"/> High</span>
              <span className="flex items-center"><span className="w-2.5 h-2.5 bg-red-600 rounded-full mr-1.5"/> Critical</span>
            </div>
            <span className="font-mono text-[11px]">Real-time MoSJE Sync</span>
          </div>
        </div>

        {/* Intervention Effectiveness Summary */}
        <div className="bg-white border border-[#ebebeb] p-6 rounded-2xl shadow-xs space-y-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[#171717]">Intervention Performance</h2>
            <p className="text-xs text-[#8f8f8f]">Efficacy of assigned support programs</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#fafafa] border border-[#ebebeb] rounded-xl space-y-1">
              <div className="flex justify-between font-semibold text-[#171717]">
                <span>Crisis Trauma Counselling</span>
                <span className="font-mono text-emerald-600">92% Resolution</span>
              </div>
              <p className="text-[11px] text-[#8f8f8f]">Average distress score reduction: -24 pts</p>
            </div>

            <div className="p-3 bg-[#fafafa] border border-[#ebebeb] rounded-xl space-y-1">
              <div className="flex justify-between font-semibold text-[#171717]">
                <span>Witness Protection Escort</span>
                <span className="font-mono text-emerald-600">96% Satisfaction</span>
              </div>
              <p className="text-[11px] text-[#8f8f8f]">Significant court hearing panic reduction</p>
            </div>

            <div className="p-3 bg-[#fafafa] border border-[#ebebeb] rounded-xl space-y-1">
              <div className="flex justify-between font-semibold text-[#171717]">
                <span>Financial Compensation</span>
                <span className="font-mono text-blue-600">Avg 4.2 Days Credit</span>
              </div>
              <p className="text-[11px] text-[#8f8f8f]">MoSJE direct benefit transfer integration</p>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-[#8f8f8f] border-t border-[#f2f2f2]">
            Evidence-based policy planning powered by longitudinal AI monitoring.
          </div>
        </div>
      </div>
    </div>
  );
};
