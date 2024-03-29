import { Line } from 'react-chartjs-2';

export function ChartComponent(props) {  
    const { labelsArray, dataArray, chartName } = props;
    return (
        <div className="preview" >
            <Line
                data={{
                    labels: labelsArray,
                    datasets: [
                        {
                            label: chartName,
                            data: dataArray,
                            fill: false,
                            borderColor: "rgb(0,139,225)",
                            borderWidth: 2,
                            pointRadius: 0,
                        },
                    ],
                }}
                options={{
                    maintainAspectRatio: true,
                    scales: {
                        yAxes: [
                            {
                                ticks: {
                                    beginAtZero: true,
                                },
                            },
                        ],
                        xAxes: [
                            {
                                scaleLabel: {
                                    display: true,
                                    labelString: 'Time (second)',
                                    fontColor: "rgb(0,139,225)"
                                }
                            }
                        ]
                    },
                    legend: {
                        labels: {
                            fontSize: 15,
                            fontColor: "rgb(0,139,225)",
                        },
                    },
                }}
            />
        </div>
    );
}