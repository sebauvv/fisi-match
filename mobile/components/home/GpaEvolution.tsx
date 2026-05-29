import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import type { AcademicPeriod } from '../../types/student';

interface Props {
  periodos: AcademicPeriod[];
  promedioGlobal: number;
  textColor: string;
  lineColor?: string;
}

function calcAvg(cursos: AcademicPeriod['cursos']): number | null {
  let sumWt = 0, sumCred = 0;
  for (const c of cursos) {
    const cal = parseFloat(c.calificacion);
    const cred = parseFloat(c.creditos);
    if (!isNaN(cal) && !isNaN(cred) && cred > 0) {
      sumWt += cal * cred;
      sumCred += cred;
    }
  }
  return sumCred > 0 ? Math.round((sumWt / sumCred) * 100) / 100 : null;
}

export default function GpaEvolution({ periodos, promedioGlobal, textColor, lineColor = '#5B8DEF' }: Props) {
  const data = useMemo(() =>
    periodos
      .map(p => ({ value: calcAvg(p.cursos) ?? 0, label: p.periodo, dataPointText: '' }))
      .filter(d => d.value > 0),
    [periodos]
  );

  if (data.length < 2) return null;

  return (
    <View className="rounded-2xl border border-border bg-surface p-5">
      <Text className="text-sm font-semibold text-foreground mb-4">
        Evolución del Promedio por Periodo
      </Text>
      <LineChart
        data={data}
        height={160}
        width={260}
        color={lineColor}
        thickness={2}
        dataPointsColor={lineColor}
        dataPointsRadius={4}
        yAxisTextStyle={{ color: textColor, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: textColor, fontSize: 9, width: 40 }}
        hideYAxisText={false}
        maxValue={20}
        noOfSections={4}
        yAxisSide="left"
        curved
        showReferenceLine1
        referenceLine1Position={promedioGlobal}
        referenceLine1Config={{ color: '#C4893D', dashWidth: 6, dashGap: 3, thickness: 1.5 }}
        hideRules={false}
        rulesColor={textColor + '30'}
        rulesType="dashed"
        isAnimated
      />
      <View className="flex-row items-center gap-2 mt-2">
        <View className="w-3 h-0.5 bg-warning" style={{ borderStyle: 'dashed' }} />
        <Text className="text-[10px] text-muted">Prom. global: {promedioGlobal}</Text>
      </View>
    </View>
  );
}
