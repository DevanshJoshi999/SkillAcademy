document.addEventListener('DOMContentLoaded', async () => {
    const lessonContent = document.getElementById('lessonContent');
    const codeInput = document.getElementById('codeInput');
    const outputFrame = document.getElementById('outputFrame');
    const languageSelector = document.getElementById('languageSelector');
    const nextExerciseButton = document.getElementById('nextExerciseButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const taskContent = document.getElementById('taskContent');
    let currentExerciseIndex = 0; // Keeps track of the current exercise
    let exercises = []; // Store exercises globally

    async function getExercises(topicId) {
        try {
            console.log(`Fetching exercises for topic ID: ${topicId}...`);
            const response = await fetch(`https://dev-api.skill.college/skillAcademy/exercises/getAll`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const exercises = await response.json();
            console.log('Fetched exercises:', exercises);
            return exercises.filter(exercise => exercise.topic_id === topicId);
        } catch (error) {
            console.error('Error fetching exercises:', error);
            return [];
        }
    }

    async function getTasks(exerciseId) {
        try {
            console.log(`Fetching tasks for exercise ID: ${exerciseId}...`);
            const response = await fetch(`https://dev-api.skill.college/skillAcademy/tasks/getAll`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const tasks = await response.json();
            console.log('Fetched tasks:', tasks);
            return tasks.filter(task => task.exercise_id === exerciseId);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            return [];
        }
    }

    async function translateContent(content, language) {
        try {
            console.log(`Translating content to ${language}...`);
            const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${language}&dt=t&q=${encodeURI(content)}`);
            const translation = await response.json();
            return translation[0].map(item => item[0]).join('');
        } catch (error) {
            console.error('Error translating content:', error);
            return content;
        }
    }

    function formatContent(content) {
        // Sanitize HTML tags and replace line breaks with <br>
        const sanitizedContent = content
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/&/g, '&amp;')
            .replace(/\n/g, '<br>');

        return sanitizedContent;
    }

    async function loadExercise() {
        if (!exercises || currentExerciseIndex >= exercises.length) {
            lessonContent.innerHTML = 'No more exercises available.';
            nextExerciseButton.style.display = 'none';
            return;
        }

        loadingIndicator.style.display = 'block'; // Show loading indicator
        lessonContent.style.opacity = '0.5'; // Reduce opacity while loading
        taskContent.innerHTML = ''; // Clear previous task content

        const exercise = exercises[currentExerciseIndex];

        const contentElement = document.createElement('div');

        const formattedContent = formatContent(exercise.content);

        contentElement.innerHTML = `
            <h1>${exercise.title}</h1>
            <p>${formattedContent}</p>
        `;

        lessonContent.innerHTML = ''; // Clear previous content
        lessonContent.appendChild(contentElement);

        const translatedContent = await translateContent(exercise.content, languageSelector.value);
        contentElement.querySelector('p').innerHTML = formatContent(translatedContent);

        // Fetch and display tasks
        const tasks = await getTasks(exercise.id);
        if (tasks.length > 0) {
            const taskList = document.createElement('ul');
            tasks.forEach(task => {
                console.log('Appending task:', task.description); // Log the task description
                const taskItem = document.createElement('li');
                taskItem.textContent = task.description; // Set as plain text
                taskList.appendChild(taskItem);
            });
            taskContent.innerHTML = '<h2>Tasks</h2>';
            taskContent.appendChild(taskList);
        } else {
            taskContent.innerHTML = '<h2>Tasks</h2><p>No tasks available for this exercise.</p>';
        }

        loadingIndicator.style.display = 'none'; // Hide loading indicator
        lessonContent.style.opacity = '1'; // Restore opacity after loading

        document.getElementById('runCode').addEventListener('click', () => {
            const userCode = codeInput.value;
            const output = `
                <html>
                    <body>
                        <pre>${userCode}</pre>
                    </body>
                </html>
            `;
            outputFrame.srcdoc = output;
        });

        nextExerciseButton.style.display = 'block'; // Display next exercise button
    }

    async function loadLesson() {
        const params = new URLSearchParams(window.location.search);
        const topicId = params.get('topicId');
        if (!topicId) {
            alert('No topic selected');
            return;
        }

        exercises = await getExercises(topicId);

        if (exercises.length > 0) {
            nextExerciseButton.addEventListener('click', () => {
                currentExerciseIndex++;
                loadExercise();
            });

            loadExercise();
        } else {
            lessonContent.innerHTML = 'No exercises available for this topic.';
        }
    }

    loadLesson();

    // Disable paste functionality in codeInput textarea
    codeInput.addEventListener('paste', (event) => {
        event.preventDefault();
        alert('Copying and pasting code is disabled in this field.');
        // Optionally, you can clear the clipboard data to prevent pasting altogether:
        // const clipboardData = event.clipboardData || window.clipboardData;
        // clipboardData.setData('text', '');
    });

});
