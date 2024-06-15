import { useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';

const AllocationChart = () => {
    const chartRef = useRef(null);

    const doughnutLabel = useMemo(
        () => ({
            id: 'doughnutText',
            afterDatasetsDraw: (chart, args, pluginOptions) => {
                const { ctx, data, _active } = chart;
                const { top, bottom, left, right, width, height } = chart.chartArea;
                ctx.save();

                let x, y;
                console.log(_active.length)
                if (_active.length) {
                    if (_active[0].datasetIndex === 0) {
                        x = width / 2;
                        y = height / 2;
                    } else {
                        x = _active[0].element.x;
                        y = _active[0].element.y;
                    }

                    const dataLabel = data.labels[_active[0].index];
                    const datasetIndexValue = _active[0].datasetIndex;
                    const dataIndexValue = _active[0].index;
                    const dataPoint = data.datasets[datasetIndexValue].data[dataIndexValue];
                    const borderColor = data.datasets[datasetIndexValue].borderColor;
                    const backgroundColor = data.datasets[datasetIndexValue].backgroundColor;

                    ctx.font = 'normal 14px DM Sans';
                    ctx.fillStyle = borderColor ? borderColor[dataIndexValue] : backgroundColor[dataIndexValue];
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`${dataLabel}: ${dataPoint}`, x, y);
                }
                ctx.restore();
            },
        }),
        []
    );

    const data = useMemo(
        () => ({
            labels: ['Idea Name', 'Strategy Name', 'Stock Name'],
            datasets: [
                {
                    data: [20, 30, 10],
                    backgroundColor: ['#8A56E2', '#E256AE', '#56E2CF', '#01C36D', '#5668E2', '#E25668'],
                    hoverBorderColor: ['#8A56E2', '#E256AE', '#56E2CF', '#01C36D', '#5668E2', '#E25668'],
                    hoverBackgroundColor: ['#8A56E2', '#E256AE', '#56E2CF', '#01C36D', '#5668E2', '#E25668'],
                    borderWidth: 0,
                    hoverBorderWidth: 5,
                },
                {
                    data: [40, 10, 20, 50, 30, 18, 50, 30, 18, 15, 20, 30, 15, 20, 30, 40, 10, 20],
                    backgroundColor: [
                        '#8A56E280',
                        '#8A56E280',
                        '#8A56E280',
                        '#8A56E280',
                        '#8A56E280',
                        '#8A56E280',
                        '#E256AE80',
                        '#E256AE80',
                        '#E256AE80',
                        '#E256AE80',
                        '#E256AE80',
                        '#E256AE80',
                        '#56E2CF80',
                        '#56E2CF80',
                        '#56E2CF80',
                        '#56E2CF80',
                        '#56E2CF80',
                        '#56E2CF80',
                    ],
                    hoverBorderColor: [
                        '#8A56E280',
                        '#8A56E280',
                        '#8A56E280',
                        '#8A56E280',
                        '#8A56E280',
                        '#8A56E280',
                        '#E256AE80',
                        '#E256AE80',
                        '#E256AE80',
                        '#E256AE80',
                        '#E256AE80',
                        '#E256AE80',
                        '#56E2CF80',
                        '#56E2CF80',
                        '#56E2CF80',
                        '#56E2CF80',
                        '#56E2CF80',
                        '#56E2CF80',
                    ],
                    hoverBackgroundColor: [
                        '#8A56E280',
                        '#8A56E280',
                        '#8A56E280',
                        '#8A56E280',
                        '#8A56E280',
                        '#8A56E280',
                        '#E256AE80',
                        '#E256AE80',
                        '#E256AE80',
                        '#E256AE80',
                        '#E256AE80',
                        '#E256AE80',
                        '#56E2CF80',
                        '#56E2CF80',
                        '#56E2CF80',
                        '#56E2CF80',
                        '#56E2CF80',
                        '#56E2CF80',
                    ],
                    borderWidth: 1,
                    borderColor: '#2A2136',
                    hoverBorderWidth: 5,
                },
            ],
        }),
        []
    );

    const options = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            cutout: 80,
            plugins: {
                legend: {
                    position: 'bottom',
                    cursor: 'pointer',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'Rounded',
                        color: '#fff',
                        padding: 15,
                    },
                },
                tooltip: {
                    enabled: false,
                },
                crosshair: false,
            },
        }),
        []
    );

    useEffect(() => {
        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        const myDoughnutChart = new Chart(ctx, {
            type: 'doughnut',
            data,
            options,
            plugins: [doughnutLabel],
        });

        return () => {
            myDoughnutChart.destroy();
        };
    }, [data, options, doughnutLabel]);

    return (
        <div className="mt-4">
            <canvas
                id="myAllocationChart"
                ref={chartRef}
                width={180}
                height={230}
                style={{ padding: '.6rem' }}
            ></canvas>
        </div>
    );
};

export default AllocationChart;