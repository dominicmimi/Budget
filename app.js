// Wait for the DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
  const descInput = document.getElementById('desc');
  const amountInput = document.getElementById('amount');
  const typeInput = document.getElementById('type');
  const addBtn = document.getElementById('add-btn');
  const transactionList = document.getElementById('transaction-list');
  const dailyBudgetInput = document.getElementById('daily-budget');
  const remainingDisplay = document.getElementById('remaining');

  let dailyBudget = Number(localStorage.getItem('dailyBudget')) || 0;
  let allTransactions = await db.getAll();

  dailyBudgetInput.value = dailyBudget;
  updateRemaining();
  renderTransactions();
  renderCharts();

  // Handle daily budget change
  dailyBudgetInput.addEventListener('change', () => {
    dailyBudget = Number(dailyBudgetInput.value);
    localStorage.setItem('dailyBudget', dailyBudget);
    updateRemaining();
  });

  // Add transaction
  addBtn.addEventListener('click', async () => {
    const desc = descInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;

    if (!desc || !amount) return alert('Please fill out all fields');

    const transaction = {
      id: Date.now(),
      desc,
      amount,
      type,
      date: new Date().toISOString()
    };

    await db.add(transaction);
    allTransactions.push(transaction);
    descInput.value = '';
    amountInput.value = '';
    renderTransactions();
    updateRemaining();
    renderCharts();
  });

  function renderTransactions() {
    transactionList.innerHTML = '';
    allTransactions
      .slice().reverse()
      .forEach(tx => {
        const li = document.createElement('li');
        li.className = tx.type;
        li.innerHTML = `
          <span>${tx.desc}</span>
          <span>${tx.type === 'expense' ? '-' : '+'}₱${tx.amount}</span>
        `;
        transactionList.appendChild(li);
      });
  }

  function updateRemaining() {
    const today = new Date().toISOString().slice(0, 10);
    const spentToday = allTransactions
      .filter(t => t.type === 'expense' && t.date.startsWith(today))
      .reduce((sum, t) => sum + t.amount, 0);
    const remaining = dailyBudget - spentToday;
    remainingDisplay.textContent = `₱${remaining}`;
  }

  function renderCharts() {
    // Pie: total income vs expense
    const income = allTransactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const expense = allTransactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);

    new Chart(document.getElementById('pie-chart'), {
      type: 'pie',
      data: {
        labels: ['Income', 'Expenses'],
        datasets: [{
          data: [income, expense],
          backgroundColor: ['#28a745', '#dc3545']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });

    // Bar: daily expense
    const byDay = {};
    allTransactions.forEach(t => {
      if (t.type !== 'expense') return;
      const day = t.date.slice(0, 10);
      byDay[day] = (byDay[day] || 0) + t.amount;
    });

    const labels = Object.keys(byDay);
    const data = Object.values(byDay);

    new Chart(document.getElementById('bar-chart'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Daily Expenses',
          data,
          backgroundColor: '#ff6b6b'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

    // Summary chart: spending over time (line)
    new Chart(document.getElementById('summary-chart'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Spending Summary',
          data,
          borderColor: '#007bff',
          fill: false,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
});
