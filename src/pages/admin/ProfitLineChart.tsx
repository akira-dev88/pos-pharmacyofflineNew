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

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const lineColor = "#22c55e";
    const fillGradient = ctx.createLinearGradient(0, 0, 0, 300);
    fillGradient.addColorStop(0, "rgba(34,197,94,0.18)");
    fillGradient.addColorStop(1, "rgba(34,197,94,0.02)");
    const gridColor = "rgba(0,0,0,0.06)";
    const labelColor = "rgba(0,0,0,0.4)";

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((d) => d.date),
        datasets: [
          {
            label: "Revenue",
            data: data.map((d) => d.revenue),
            borderColor: lineColor,
            borderWidth: 2.5,
            backgroundColor: fillGradient,
            fill: true,
            tension: 0.45,
            pointRadius: 0,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: lineColor,
            pointHoverBorderColor: "#fff",
            pointHoverBorderWidth: 2.5,
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
            enabled: true,
            backgroundColor: "#1c1c1e",
            titleColor: "rgba(255,255,255,0.7)",
            bodyColor: "#ffffff",
            padding: { top: 10, bottom: 10, left: 14, right: 14 },
            cornerRadius: 10,
            displayColors: false,
            titleFont: { size: 12, weight: "400" as any },
            bodyFont: { size: 16, weight: "500" as any },
            callbacks: {
              title: function (items) {
                const idx = items[0].dataIndex;
                return (data[idx]?.revenue || 0).toLocaleString() + " sales";
              },
              label: function (item: any) {
                return "₹" + Number(item.raw).toLocaleString();
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: labelColor,
              font: { size: 11 },
              maxRotation: 0,
              autoSkip: data.length > 30,
              maxTicksLimit: data.length > 30 ? 12 : data.length,
            },
          },
          y: {
            position: "right",
            grid: { color: gridColor, drawTicks: false },
            border: { display: false, dash: [4, 4] },
            ticks: {
              color: labelColor,
              font: { size: 11 },
              padding: 10,
              callback: (v) =>
                Number(v) >= 1000
                  ? (Number(v) / 1000).toFixed(0) + "k"
                  : v,
            },
            min: 0,
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [data]);

  return <canvas ref={canvasRef} />;
}
