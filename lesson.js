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

    languageSelector.addEventListener('change', () => {
        loadExercise();
    });

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
        // Reverse HTML entity encoding for <, >, etc.
        const reversedContent = content
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
        
        // Replace line breaks with <br> and escape remaining HTML entities
        const sanitizedContent = reversedContent
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            .replace(/\s\s+/g, ' '); // Replace multiple spaces with single space
    
        return sanitizedContent;
    }

    async function loadExercise() {
        if (currentExerciseIndex >= exercises.length) {
            // No more exercises available
            lessonContent.innerHTML = '<p>No exercises remaining for the current topic.</p>';
            taskContent.innerHTML = '';
            nextExerciseButton.disabled = true;
            return;
        }

        loadingIndicator.style.display = 'block'; // Show loading indicator
        lessonContent.style.display = 'none'; // Hide lesson content while loading
        taskContent.style.display = 'none'; // Hide task content while loading

        const exercise = exercises[currentExerciseIndex];

        const contentElement = document.createElement('div');

        const formattedTitle = formatContent(exercise.title);
        const formattedContent = formatContent(exercise.content);

        contentElement.innerHTML = `
            <h1>${formattedTitle}</h1>
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
            tasks.forEach((task, index) => {
                console.log('Appending task:', task.description); // Log the task description
                const taskItem = document.createElement('li');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.disabled = true; // Disable manual checking
                checkbox.id = `task_${index + 1}`; // Unique ID for each checkbox

                // Preserve HTML tags in task description
                const taskDescription = formatContent(task.description);
                taskItem.innerHTML = `
                    <label for="${checkbox.id}">
                        <input type="checkbox" id="${checkbox.id}" disabled>
                        ${taskDescription}
                    </label>`;
                taskList.appendChild(taskItem);
            });
            taskContent.innerHTML = '<h2>Tasks</h2>';
            taskContent.appendChild(taskList);
        } else {
            taskContent.innerHTML = '<h2>Tasks</h2><p>No tasks available for this exercise.</p>';
        }

        loadingIndicator.style.display = 'none'; // Hide loading indicator
        lessonContent.style.display = 'block'; // Show lesson content after loading
        taskContent.style.display = 'block'; // Show task content after loading

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

            // Validate code
            tasks.forEach((task, index) => {
                const checkbox = document.getElementById(`task_${index + 1}`);
                if (validateCode(userCode, task.validate_code)) {
                    checkbox.checked = true;
                } else {
                    checkbox.checked = false;
                }
            });

            // Enable next exercise button when all tasks are completed
            const allTasksCompleted = tasks.every((task, index) => {
                const checkbox = document.getElementById(`task_${index + 1}`);
                return checkbox.checked;
            });
            nextExerciseButton.disabled = !allTasksCompleted;
        });

        nextExerciseButton.style.display = 'block'; // Display next exercise button
        nextExerciseButton.disabled = true; // Disable next exercise button initially

        nextExerciseButton.addEventListener('click', () => {
            currentExerciseIndex++;
            if (currentExerciseIndex <= exercises.length) {
                loadExercise();
            } else {
                // Handle end of exercises scenario
                lessonContent.innerHTML = '<p>No exercises remaining for the current topic.</p>';
                taskContent.innerHTML = '';
                nextExerciseButton.disabled = true;
            }
        });
    }

    function validateCode(userCode, validateArray) {
        let remainingCode = userCode;
        for (let i = 0; i < validateArray.length; i++) {
            const index = remainingCode.indexOf(validateArray[i]);
            if (index === -1) {
                return false;
            }
            remainingCode = remainingCode.slice(index + validateArray[i].length);
        }
        return true;
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
            loadExercise();
        } else {
            lessonContent.innerHTML = '<p>No exercises available for this topic.</p>';
            taskContent.innerHTML = '';
            nextExerciseButton.disabled = true;
        }
    }

    loadLesson();

    // Disable paste functionality in codeInput textarea
    codeInput.addEventListener('paste', (event) => {
        event.preventDefault();
        alert('Copying and pasting code is disabled in this field.');
    });
});
