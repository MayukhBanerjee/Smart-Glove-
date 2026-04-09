'use client';

import { MockData } from '@/lib/mock-data';
import { Zap, TrendingUp, Activity, Gauge, Wind, Thermometer } from 'lucide-react';
import { GripCard } from './cards/grip-card';
import { FormCard } from './cards/form-card';
import { FatigueCard } from './cards/fatigue-card';
import { StabilityCard } from './cards/stability-card';
import { RepCard } from './cards/rep-card';
import { TemperatureCard } from './cards/temperature-card';

interface KPIGridProps {
  data: MockData;
}

export function KPIGrid({ data }: KPIGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      {/* Card 1: Grip Intelligence */}
      <GripCard data={data.gripIntelligence} />

      {/* Card 2: Form Quality */}
      <FormCard data={data.formQuality} />

      {/* Card 3: Fatigue Index - Span 2 columns on lg */}
      <div className="md:col-span-2 lg:col-span-2">
        <FatigueCard data={data.fatigueIndex} />
      </div>

      {/* Card 4: Stability Score */}
      <StabilityCard score={data.stabilityScore} />

      {/* Card 5: Rep Intelligence */}
      <RepCard data={data.repIntelligence} />

      {/* Card 6: Body Temperature */}
      <TemperatureCard temperature={data.bodyTemperature} />
    </div>
  );
}
