document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('distributionChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Liquidity', 'Community Rewards', 'Creator Plan', 'Ecosystem Fund', 'Team & Investors'],
            datasets: [{
                data: [70, 10, 10, 5, 5],
                backgroundColor: [
                    '#CDF7FF',
                    '#9BE4FF',
                    '#69D1FF',
                    '#37BEFF',
                    '#05ABFF'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}); 