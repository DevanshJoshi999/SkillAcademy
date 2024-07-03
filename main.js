document.addEventListener('DOMContentLoaded', () => {
    const content = document.getElementById('content');
  
    async function getTopics() {
      try {
        console.log('Fetching topics...');
        const response = await fetch('https://dev-api.skill.college/skillAcademy/topics/getAll');
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
  
    async function loadTopics() {
      const topics = await getTopics();
      if (topics.length === 0) {
        content.innerHTML = '<p>No topics available.</p>';
        return;
      }
  
      topics.forEach((topic, index) => {
        const topicElement = document.createElement('div');
        topicElement.className = 'topic';
        topicElement.innerHTML = `<div class="icon">▶</div>`;
        topicElement.addEventListener('click', () => {
          if (confirm(`Do you want to continue to ${topic.title}?`)) {
            window.location.href = `lesson.html?topicId=${topic.id}`;
          }
        });
        content.appendChild(topicElement);
  
        if (index < topics.length - 1) {
          const separator = document.createElement('div');
          separator.className = 'separator';
          content.appendChild(separator);
        }
      });
    }
  
    loadTopics();
  });
  