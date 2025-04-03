
import {ChartProps, Line} from 'react-chartjs-2';
import 'chart.js/auto';

interface Props {
    data: any;
}

export function DateChart({data}: Props) {

    const options = {
        interaction: {
            mode: "index",
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
                    callback: (value: number) => value.toFixed(0),
                },
            },
        },
    };

    // @ts-ignore
    return (
        <>
            {/*<LineChart width={500} height={300} data={data}>
                <Line type="monotone" dataKey="value" stroke="#8884d8" dot={false} />
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
            </LineChart>*/}
            <Line width={600} height={300} data={data}  />
        </>
    )
}