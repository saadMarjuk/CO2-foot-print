let carbonChart = null;

async function analyzeSite() {
  const url = document.getElementById("urlInput").value.trim();
  const resultDiv = document.getElementById("result");

  if (!url) {
    resultDiv.innerHTML = "⚠️ Please enter a valid URL.";
    return;
  }

  resultDiv.innerHTML = "⏳ Analyzing...";
  try {
    // Use relative URL (works locally and on Render)
    const res = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    resultDiv.innerHTML = `
      ✅ <b>${data.url}</b><br>
      Page Size: ${data.pageSize}<br>
      Estimated CO₂: ${data.estimatedCO2}<br>
      Date: ${data.date}
    `;

    await loadHistory();
  } catch (err) {
    resultDiv.innerHTML = "❌ Error: " + err.message;
  }
}

async function loadHistory() {
  try {
    const res = await fetch("/history"); // relative URL
    const data = await res.json();
    const historyList = document.getElementById("history");

    historyList.innerHTML = data
      .map(
        (d) => `
        <li>
          <b>${d.url}</b> — ${d.pageSize}, ${d.estimatedCO2} <br>
          <small>${d.date}</small>
        </li>`
      )
      .join("");

    updateChart(data);
  } catch (err) {
    console.error("Failed to load history:", err);
  }
}

function updateChart(data) {
  const ctx = document.getElementById("carbonChart").getContext("2d");

  const labels = data.map((d) => d.url);
  const values = data.map((d) =>
    parseFloat(d.estimatedCO2.replace(" g per visit", ""))
  );

  if (carbonChart) {
    carbonChart.destroy();
  }

  carbonChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "CO₂ Emission (grams per visit)",
          data: values,
          backgroundColor: "rgba(0, 255, 102, 0.6)",
          borderColor: "#00ff66",
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        legend: { labels: { color: "#d4ffd4" } },
      },
      scales: {
        x: { ticks: { color: "#d4ffd4" } },
        y: {
          ticks: { color: "#d4ffd4" },
          beginAtZero: true,
          title: {
            display: true,
            text: "grams CO₂ / visit",
            color: "#d4ffd4",
          },
        },
      },
    },
  });
}

// Load history when the page loads
document.addEventListener("DOMContentLoaded", loadHistory);
