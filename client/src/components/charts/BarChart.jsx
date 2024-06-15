import { useEffect } from 'react';
import { Chart, Interaction, registerables } from 'chart.js';
import { CrosshairPlugin, Interpolate } from 'chartjs-plugin-crosshair';

const BarChart = () => {
    Chart.register(CrosshairPlugin);
    Chart.register(...registerables);
    Interaction.modes.interpolate = Interpolate;

    const generateRandomData = (min, max, length) => {
        return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min);
    };

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dummydata = generateRandomData(0, 80, 6);

    useEffect(() => {
        // Sample data for the bar chart
        const data = {
            labels: labels,
            datasets: [
                {
                    label: 'Nifty',
                    data: dummydata,
                    borderColor: '#5698FF',
                    borderWidth: 2,
                    backgroundColor: 'rgba(30, 41, 67)',
                    categoryPercentage: 0.3,
                    borderRadius: Number.MAX_VALUE,
                }
            ],
        };

        const options = {
            responsive: true,
            fill: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    display: true,
                    grid: {
                        display: false,
                    }
                },
                x: {
                    display: true,
                    grid: {
                        display: false
                    }
                    // stacked: true,
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
                }
            },
        };

        const ctx = document.getElementById('myBarChart');
        if (ctx) {
            const myBarChart = new Chart(ctx, {
                type: 'bar',
                data: data,
                options: options,
            });

            return () => {
                myBarChart.destroy();
            };
        }
    }, []);

    return (
        <div className="w-full">
            <canvas id="myBarChart" width={350} height={250}></canvas>
        </div>
    );
};

export default BarChart;
