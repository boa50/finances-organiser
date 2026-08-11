import * as d3 from 'd3';
import { MonthlyAggregate } from '../types';

interface UseEvolutionChartD3Props {
  monthlyData: MonthlyAggregate[];
  width: number;
  height: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

export function useEvolutionChartD3({
  monthlyData,
  width,
  height,
  marginTop = 20,
  marginRight = 20,
  marginBottom = 40,
  marginLeft = 55,
}: UseEvolutionChartD3Props) {
  const innerWidth = width - marginLeft - marginRight;
  const innerHeight = height - marginTop - marginBottom;

  const xScale = d3
    .scalePoint<string>()
    .domain(monthlyData.map((d) => d.monthLabel))
    .range([0, innerWidth])
    .padding(0.2);

  const maxVal = d3.max(monthlyData, (d) => Math.max(d.income, d.expense)) || 1000;
  const yScale = d3
    .scaleLinear()
    .domain([0, maxVal * 1.15])
    .nice()
    .range([innerHeight, 0]);

  const incomeLineGenerator = d3
    .line<MonthlyAggregate>()
    .x((d) => xScale(d.monthLabel) || 0)
    .y((d) => yScale(d.income))
    .curve(d3.curveMonotoneX);

  const expenseLineGenerator = d3
    .line<MonthlyAggregate>()
    .x((d) => xScale(d.monthLabel) || 0)
    .y((d) => yScale(d.expense))
    .curve(d3.curveMonotoneX);

  const incomeAreaGenerator = d3
    .area<MonthlyAggregate>()
    .x((d) => xScale(d.monthLabel) || 0)
    .y0(innerHeight)
    .y1((d) => yScale(d.income))
    .curve(d3.curveMonotoneX);

  const expenseAreaGenerator = d3
    .area<MonthlyAggregate>()
    .x((d) => xScale(d.monthLabel) || 0)
    .y0(innerHeight)
    .y1((d) => yScale(d.expense))
    .curve(d3.curveMonotoneX);

  return {
    innerWidth,
    innerHeight,
    xScale,
    yScale,
    incomePath: incomeLineGenerator(monthlyData) || '',
    expensePath: expenseLineGenerator(monthlyData) || '',
    incomeAreaPath: incomeAreaGenerator(monthlyData) || '',
    expenseAreaPath: expenseAreaGenerator(monthlyData) || '',
    yTicks: yScale.ticks(5),
  };
}
