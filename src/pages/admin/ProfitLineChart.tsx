import { useEffect, useRef } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip
);

interface ProfitLineChartProps {
  data: { date: string; revenue: number; cost: number; profit: number }[];
}

export default function ProfitLineChart({ data }: ProfitLineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Destroy previous instance to avoid canvas reuse error
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const makeGradient = (color: string) => {
      const g = ctx.createLinearGradient(0, 0, 0, 280);
      g.addColorStop(0, color + "33");
      g.addColorStop(1, color + "00");
      return g;
    };

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((d) => d.date),
        datasets: [
          {
            label: "Revenue",
            data: data.map((d) => d.revenue),
            borderColor: "#10b981",
            backgroundColor: makeGradient("#10b981"),
            borderWidth: 2.5,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "#10b981",
            pointHoverBorderColor: "#0f1117",
            pointHoverBorderWidth: 2,
            fill: true,
            tension: 0.45,
          },
          {
            label: "Cost",
            data: data.map((d) => d.cost),
            borderColor: "#f87171",
            backgroundColor: makeGradient("#f87171"),
            borderWidth: 2.5,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "#f87171",
            pointHoverBorderColor: "#0f1117",
            pointHoverBorderWidth: 2,
            fill: true,
            tension: 0.45,
            borderDash: [6, 3],
          },
          {
            label: "Profit",
            data: data.map((d) => d.profit),
            borderColor: "#a78bfa",
            backgroundColor: makeGradient("#a78bfa"),
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: "#a78bfa",
            pointHoverBorderColor: "#0f1117",
            pointHoverBorderWidth: 2.5,
            fill: true,
            tension: 0.45,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1a1f2e",
            borderColor: "#2d3347",
            borderWidth: 1,
            padding: { x: 14, y: 12 },
            titleColor: "#e2e8f0",
            titleFont: { size: 13},
            bodyColor: "#94a3b8",
            bodyFont: { size: 12 },
            usePointStyle: true,
            callbacks: {
              label: (ctx) =>
                `  ${ctx.dataset.label}    ₹${Number(ctx.parsed.y).toLocaleString()}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: "#1e2330" },
            ticks: { color: "#4b5563", font: { size: 11 }, maxRotation: 0 },
            border: { display: false },
          },
          y: {
            grid: { color: "#1e2330" },
            ticks: {
              color: "#4b5563",
              font: { size: 11 },
              callback: (v) => `₹${(Number(v) / 1000).toFixed(0)}k`,
            },
            border: { display: false },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [data]);

  return (
    <div style={{ position: "relative", width: "100%", height: "320px" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}