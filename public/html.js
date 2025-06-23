let chart = null;
let pds, pdd;
function prob(valores) {
  let gd = 0;
  let bd = 0;
  for (let i = 0; i < valores.length - 1; i++) {
    if (valores[i] < valores[i + 1]) {
      gd++;
    } else {
      bd++;
    }
  }
  pds = (gd / (valores.length - 1)) * 100;
  pdd = (bd / (valores.length - 1)) * 100;
}

const home = document.querySelector('#home');
const search = document.querySelector('#search');
const login = document.querySelector('#login');
const login2 = document.querySelector('#login2');
const screens = [home, search, login];

function mudar(id) {
  for (let i = 0; i < screens.length; i++) {
    if (screens[i].id == id) {
      screens[i].style.display = 'block';
    } else {
      screens[i].style.display = 'none';
    }
  }
}
function aa(){
  mudar('aleatorio');
  login2.style.display = 'block';
}
function validacao(){

}
let codigo = null;
async function Login2() {
  const email = document.querySelector('#email').value;
  mudar('aleatorio');
  login2.style.display = 'block';
  const resp = await fetch('/enviarC', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailDestino: email })
  });
  if (resp.ok) {
    console.log('email enviado com sucesso!');
  } else {
    console.log('erro ao enviar email/codigo');
  }
  const respJson = await resp.json();
  codigo = respJson.codigo;
  
}

function criar() {
  const ctx1 = document.querySelector('#meuOvo').getContext('2d');
  ctx1.clearRect(0, 0, 250, 250);

  ctx1.lineWidth = 21;

  ctx1.beginPath();
  ctx1.strokeStyle = 'green';
  ctx1.arc(125, 125, 50, 0, (360 * (pds / 100)) * (Math.PI / 180));
  ctx1.stroke();

  ctx1.beginPath();
  ctx1.strokeStyle = 'red';
  ctx1.arc(125, 125, 50, (360 * (pds / 100)) * (Math.PI / 180), Math.PI * 2);
  ctx1.stroke();
}

async function envData() {
  const nome = document.querySelector('#nome').value;
  const email = document.querySelector('#email').value;
  const password = document.querySelector('#senha').value;
  const confSenha = document.querySelector('#confSenha').value;
  if (password.trim() === confSenha.trim()) {
    const response = await fetch('/salvarData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, password })
    });
    if (response.ok) {
      console.log('Dados salvos com sucesso');
    } else {
      console.log('Dados não foram salvos erro:', response.status);
    }
  } else {
    return;
  }
}

async function validarC(){
  const email = document.querySelector('#email').value;
    console.log(email, codigo);
    const re = await fetch('/validarC', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailDestino: email, codigoEnviado: codigo })
    });
    const jj = await re.json();
    if(jj.result){
      envData();
      mudar('home');
    }else {
      alert('Código inválido');
    }
}

async function buscar() {
  const simbolo = document.getElementById('ativo').value;
  if (simbolo.trim() === '') {
    console.error('Dados não preenchidos');
    alert('Preencha o ativo');
    return;
  }

  const resposta = await fetch('/dados', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ simbolo })
  });
  const json = await resposta.json();

  const ctx = document.querySelector('#myC').getContext('2d');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: json.datas,
      datasets: [{
        label: `Preço fechamento ${simbolo.toUpperCase()}`,
        data: json.valores,
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
        legend: { display: true },
        tooltip: { mode: 'index', intersect: false }
      }
    }
  });

  const maxV = document.querySelector('#maxV');
  const minV = document.querySelector('#minV');
  const medV = document.querySelector('#medV');
  let max = Number.NEGATIVE_INFINITY;
  let min = Number.POSITIVE_INFINITY;
  let med = 0;

  for (let i = 0; i < json.valores.length; i++) {
    if (json.valores[i] > max) max = json.valores[i];
    if (json.valores[i] < min) min = json.valores[i];
    med += json.valores[i];
  }

  if (json.valores.length > 0) {
    med /= json.valores.length;
    maxV.textContent = max.toFixed(2);
    minV.textContent = min.toFixed(2);
    medV.textContent = med.toFixed(2);

    prob(json.valores);
    criar();
  }
}

function pegarI() {
  buscar();
}
