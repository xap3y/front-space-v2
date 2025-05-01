
import {Line} from 'react-chartjs-2';
import 'chart.js/auto';

export function DateChart({data}) {

    const options = {
        interaction: {
            mode: 'nearest',
            intersect: false,
        },
        plugins: {
            tooltip: {
                mode: "index",
                intersect: false,
                usePointStyle: true,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    callback: (value) => value.toFixed(0),
                },
            },
        },
    };

    // @ts-ignore
    return (
        <>
            {/*<LineChart width={400} height={100} data={data}>
                <Line type="monotone" dataKey="value" stroke="#8884d8" dot={false} />
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
            </LineChart>*/}
            <Line width={400} height={100} data={data} options={options} />
        </>
    )
}