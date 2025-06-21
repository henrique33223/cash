import { datas, valores, simbolo } from './matter.js';

const ctx = document.querySelector('#myC').getContext('2d');
let chart = null;

if (chart) {
  chart.destroy();
}

chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: datas,
    datasets: [{
      label: `Preço fechamento ${simbolo}`,
      data: valores,
      borderColor: 'blue',
      backgroundColor: 'rgba(0,0,255,0.2)',
      fill: true,
      tension: 0.3,
      pointRadius: 2,
      pointHoverRadius: 5,
    }]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Preço (R$)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Data'
        }
      }
    },
    plugins: {
      legend: {
        display: true
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    }
  }
});
