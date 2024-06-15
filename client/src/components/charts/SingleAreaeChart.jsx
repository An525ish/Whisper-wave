import { useEffect } from 'react';
import { Chart, Interaction, registerables } from 'chart.js';
import { CrosshairPlugin, Interpolate } from 'chartjs-plugin-crosshair';

const SingleAreaChart = ({ chartData }) => {
    Chart.register(CrosshairPlugin);
    Chart.register(...registerables);
    Interaction.modes.interpolate = Interpolate;

    const generateRandomData = (min, max, length) => {
        return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min);
    };

    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'jun', 'jul', 'aug', 'sep', 'oct'];
    const data1 = generateRandomData(0, 100, 50);


    // Dummy data for graphLabels
    const graphLabelsDummy = ['Label 1', 'Label 2'];

    const chartDataConfig = {
        labels: labels,
        datasets: [
            {
                label: graphLabelsDummy[0],
                data: data1,
                pointRadius: 0,
                // tension: 0.4,
                borderColor: '#5698FF',
                borderWidth: 2,
                backgroundColor: (context) => {
                    const bgColor = ['rgba(30, 41, 67, 0.5)', 'rgba(30, 41, 67, 0)'];
                    if (!context.chart.chartArea) return;
                    const {
                        ctx,
                        chartArea: { top, bottom },
                    } = context.chart;
                    const gradientBg = ctx.createLinearGradient(0, top, 0, bottom);
                    gradientBg.addColorStop(0, bgColor[0]);
                    gradientBg.addColorStop(0.5, bgColor[0]);
                    gradientBg.addColorStop(1, bgColor[1]);
                    return gradientBg;
                },
            }
        ],
    };

    const options = {
        responsive: true,
        fill: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                display: false,
            },
            x: {
                display: false,
            },
        },
        plugins: {
            tooltip: {
                mode: 'interpolate',
                intersect: false,
            },
            crosshair: {
                line: {
                    color: '#5698FF',
                    width: 1,
                },
                sync: {
                    enabled: false,
                },
            },
            legend: {
                display: false
            },
        },
    };

    useEffect(() => {
        // Create the chart
        const ctx = document.getElementById('mySingleAreaChart');
        if (ctx) {
            const mySingleAreaChart = new Chart(ctx, {
                type: 'line',
                data: chartDataConfig,
                options: options,
            });

            return () => {
                mySingleAreaChart.destroy();
            };
        }
    }, [chartDataConfig]);

    return (
        <>
            <div className="w-full h-full">
                <canvas id="mySingleAreaChart" width={350} height={250}></canvas>
            </div>
        </>
    );
};

export default SingleAreaChart;
