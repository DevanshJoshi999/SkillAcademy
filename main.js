document.addEventListener('DOMContentLoaded', async () => {
  const content = document.getElementById('content');
  const confirmModal = document.getElementById('confirmModal');
  const confirmMessage = document.getElementById('confirmMessage');
  const confirmYes = document.getElementById('confirmYes');
  const confirmNo = document.getElementById('confirmNo');

  // Function to show the confirmation modal
  function showConfirmation(message, callback) {
      confirmMessage.textContent = message;
      confirmModal.style.display = 'block';

      // Listen for click on Yes button
      confirmYes.addEventListener('click', () => {
          confirmModal.style.display = 'none';
          callback(true);
      });

      // Listen for click on No button
      confirmNo.addEventListener('click', () => {
          confirmModal.style.display = 'none';
          callback(false);
      });
  }

  async function getHeaders() {
    const accessToken = sessionStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    };
  }

  async function getTopics() {
      try {
          console.log('Fetching topics...');
          const headers = await getHeaders();
          const response = await fetch('https://dev-api.skill.college/skillAcademy/topics/getAll', { headers });
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          const topics = await response.json();
          console.log('Fetched topics:', topics);
          return topics.map(topic => ({
              id: topic.id,
              title: topic.title
          }));
      } catch (error) {
          console.error('Error fetching topics:', error);
          return [];
      }
  }

  function chcekLogin(){
    let token = sessionStorage.getItem('accessToken')
    if(token == undefined){
        window.location.href = 'login.html';
       
    }
  }
  async function loadTopics() {
      const topics = await getTopics();
      if (topics.length === 0) {
          showConfirmation('Do you want to continue?', (confirmed) => {
              if (confirmed) {
                  content.innerHTML = '<p>No topics available.</p>';
              } else {
                  window.location.href = 'login.html';
              }
          });
          return;
      }

      topics.forEach((topic, index) => {
          const topicElement = document.createElement('div');
          topicElement.className = 'topic';
          topicElement.innerHTML = `<div class="icon">▶</div>`;
          topicElement.addEventListener('click', () => {
              showConfirmation(`Do you want to continue to ${topic.title}?`, (confirmed) => {
                  if (confirmed) {
                      window.location.href = `lesson.html?topicId=${topic.id}`;
                  }
              });
          });
          content.appendChild(topicElement);

          if (index < topics.length - 1) {
              const separator = document.createElement('div');
              separator.className = 'separator';
              content.appendChild(separator);
          }
      });
  }
  chcekLogin()
  loadTopics();
});
