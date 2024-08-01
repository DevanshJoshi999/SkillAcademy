document.addEventListener("DOMContentLoaded", async () => {
  const lessonContent = document.getElementById("lessonContent");
  const codeInput = document.getElementById("codeInput");
  const outputFrame = document.getElementById("outputFrame");
  const languageSelector = document.getElementById("languageSelector");
  const nextExerciseButton = document.getElementById("nextExerciseButton");
  const previousExerciseButton = document.getElementById(
    "previousExerciseButton"
  );
  const loadingIndicator = document.getElementById("loadingIndicator");
  const taskContent = document.getElementById("taskContent");
  // const params = new URLSearchParams(window.location.search);
  // const currIndexFromUrl = params.get("currentExerciseIndex");
  console.log(localStorage.getItem("currentExerciseIndex"));
  let currentExerciseIndex =  parseInt(localStorage.getItem("currentExerciseIndex")) || 0; // Initialize from sessionStorage or default to 0
  // let currentExerciseIndex =  currIndexFromUrl; // Initialize from sessionStorage or default to 0
  let exercises = []; // Store exercises globally
  let progressData = [];

  languageSelector.addEventListener("change", () => {
    loadExercise();
  });

  async function getHeaders() {
    const accessToken = localStorage.getItem("accessToken");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
  }

  async function getExercises(topicId) {
    try {
      // // console.log(`Fetching exercises for topic ID: ${topicId}...`);
      const headers = await getHeaders();
      const response = await fetch(
        `https://dev-api.skill.college/skillAcademy/exercises/getAll`,
        { headers }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const exercises = await response.json();
      // // console.log("Fetched exercises:", exercises);
      return exercises.filter((exercise) => exercise.topic_id === topicId);
    } catch (error) {
      // console.error("Error fetching exercises:", error);
      return [];
    }
  }

  async function getTasks(exerciseId) {
    try {
      // console.log(`Fetching tasks for exercise ID: ${exerciseId}...`);
      const headers = await getHeaders();
      const response = await fetch(
        `https://dev-api.skill.college/skillAcademy/tasks/getAll`,
        { headers }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const tasks = await response.json();
      // console.log("Fetched tasks:", tasks);
      return tasks.filter((task) => task.exercise_id === exerciseId);
    } catch (error) {
      // console.error("Error fetching tasks:", error);
      return [];
    }
  }

  async function createOrUpdateProgress(progress) {
    try {
      const headers = await getHeaders();
      const response = await fetch(
        "https://dev-api.skill.college/skillAcademy/progress/create/",
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify(progress),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      // console.error("Error updating progress:", error);
    }
  }

  async function getAllProgress() {
    try {
      const headers = await getHeaders();
      const response = await fetch(
        "https://dev-api.skill.college/skillAcademy/progress/getAll",
        { headers }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const progress = await response.json();
      // console.log("Fetched progress:", progress);
      return progress.map((item) => ({
        courseId: item.course_id,
        topicId: item.topic_id,
        exerciseId: item.exercise_id,
        taskId: item.task_id,
        completed: item.completed,
      }));
    } catch (error) {
      // console.error("Error fetching progress:", error);
      return [];
    }
  }

  async function translateContent(content, language) {
    try {
      // console.log(`Translating content to ${language}...`);
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${language}&dt=t&q=${encodeURI(
          content
        )}`
      );
      const translation = await response.json();
      return translation[0].map((item) => item[0]).join("");
    } catch (error) {
      // console.error("Error translating content:", error);
      return content;
    }
  }

  function formatContent(content) {
    // Reverse HTML entity encoding for <, >, etc.
    const reversedContent = content
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");

    // Replace line breaks with <br> and escape remaining HTML entities
    const sanitizedContent = reversedContent
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>")
      .replace(/\s\s+/g, " "); // Replace multiple spaces with single space

    return sanitizedContent;
  }

  async function loadExercise() {
    // console.log("Loading exercise at index:", currentExerciseIndex);
    if (currentExerciseIndex >= exercises.length) {
      // No more exercises available
      lessonContent.innerHTML =
        "<p>No exercises remaining for the current topic.</p>";
      taskContent.innerHTML = "";
      nextExerciseButton.disabled = true;
      previousExerciseButton.disabled = true;
      return;
    }

    loadingIndicator.style.display = "block"; // Show loading indicator
    lessonContent.style.display = "none"; // Hide lesson content while loading
    taskContent.style.display = "none"; // Hide task content while loading

    const exercise = exercises[currentExerciseIndex];

    codeInput.value = exercise.prebuilt_code || ""; // Pre-fill code textarea with prebuilt code if available

    const contentElement = document.createElement("div");

    const formattedTitle = formatContent(exercise.title);
    const formattedContent = formatContent(exercise.content);

    let imageHtml = "";
    if (exercise.image_url) {
      imageHtml = `<div style="background-color: black; padding: 10px; display: inline-block;">
                            <img src="${exercise.image_url}" alt="Exercise Image" style="max-width: 100%; margin-top: 20px;">
                        </div>`;
    }

    contentElement.innerHTML = `
            <h1>${formattedTitle}</h1>
            <p>${formattedContent}</p>
            ${imageHtml}
        `;

    lessonContent.innerHTML = ""; // Clear previous content
    lessonContent.appendChild(contentElement);

    const translatedContent = await translateContent(
      exercise.content,
      languageSelector.value
    );
    contentElement.querySelector("p").innerHTML =
      formatContent(translatedContent);

    // Fetch and display tasks
    const tasks = await getTasks(exercise.id);
    if (tasks.length > 0) {
      const taskList = document.createElement("ul");
      const progress = await getAllProgress();
      tasks.forEach((task, index) => {
        // console.log("Appending task:", task.description); // Log the task description
        const taskItem = document.createElement("li");
        const checkboxID = `task_${index + 1}`;
        const checkboxLabel = document.createElement("label");
        checkboxLabel.htmlFor = checkboxID;
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.disabled = true; // Disable manual checking
        checkbox.id = checkboxID;
        // console.log(checkboxID); // Unique ID for each checkbox
        taskItem.appendChild(checkbox);

        // Preserve HTML tags in task description
        const taskDescription = document.createTextNode(task.description);

        checkboxLabel.appendChild(checkbox);
        checkboxLabel.appendChild(taskDescription);
        taskList.appendChild(checkboxLabel);
        taskList.appendChild(taskItem);
        // console.log(exercise.id, ":", task.id);
        // console.log(exercise);
        const completedProgress = progress.find(
          (item) =>
            item.exerciseId === exercise.id &&
            item.taskId === task.id &&
            item.completed
        );
        if (completedProgress) {
          checkbox.checked = true;
        }
      });
      taskContent.innerHTML = "<h2>Tasks</h2>";
      taskContent.appendChild(taskList);
    } else {
      taskContent.innerHTML =
        "<h2>Tasks</h2><p>No tasks available for this exercise.</p>";
    }

    loadingIndicator.style.display = "none"; // Hide loading indicator
    lessonContent.style.display = "block"; // Show lesson content after loading
    taskContent.style.display = "block"; // Show task content after loading

    document.getElementById("runCode").addEventListener("click", async (event) => {
      const userCode = codeInput.value;
      const output = `
                <html>
                    <body>
                        <pre>${userCode}</pre>
                    </body>
                </html>
            `;
      outputFrame.srcdoc = output;

      const codeTab = document.querySelector(".tablink[data-tab='Code']");
      const outputTab = document.querySelector(".tablink[data-tab='Output']");
      document.querySelectorAll(".tablink").forEach(tab => {
        tab.classList.remove("active");
      });
    
      // Hide all tab contents
      document.querySelectorAll(".tabcontent").forEach(content => {
        content.style.display = "none";
      });
    
      // Show the Output tab content
      document.getElementById("Output").style.display = "block";
    
      // Add active class to Output tab
      outputTab.classList.add("active");
      //openTab(event, "Output");

      // console.log(tasks);
      // console.log(tasks.length);
      // Validate code
      for (let index = 0; index < tasks.length; index++) {
        const task = tasks[index];
        // console.log("Task Out of IF : " + task);
        const checkbox = document.getElementById(`task_${index + 1}`);
        if (validateCode(userCode, task.validate_code)) {
          // console.log(index + 1);
          // console.log("Task In If : ", task);

          checkbox.checked = true;
          const progress = {
            course_id: "58f8124b-0d4f-42a8-9dd8-3499ab12cf02",
            topic_id: exercise.topic_id,
            exercise_id: exercise.id,
            task_id: task.id,
            completed: true,
          };
          // console.log("Progress body : ", progress);
          try {
            // console.log("I am calling");
            await createOrUpdateProgress(progress);
          } catch (error) {
            // console.error("Error updating progress:", error);
            // Handle error as needed, e.g., notify the user
          }
        } else {
          checkbox.checked = false;
        }
      }
      const allTasksCompleted = tasks.every((task, index) => {
        const checkbox = document.getElementById(`task_${index + 1}`);
        return checkbox.checked;
      });
      // console.log(allTasksCompleted);
      nextExerciseButton.disabled = !allTasksCompleted;
      // Enable next exercise button when all tasks are completed
    });

    const allTasksCompleted = tasks.every((task, index) => {
      const checkbox = document.getElementById(`task_${index + 1}`);
      return checkbox.checked;
    });
    // console.log(allTasksCompleted);
    nextExerciseButton.disabled = !allTasksCompleted;
    // console.log(tasks);

    nextExerciseButton.style.display = "block"; // Display next exercise button
    previousExerciseButton.style.display = "block"; // Display previous exercise button

    nextExerciseButton.removeEventListener(
      "click",
      handleNextExerciseButtonClick
    );
    nextExerciseButton.addEventListener("click", handleNextExerciseButtonClick);

    previousExerciseButton.removeEventListener(
      "click",
      handlePreviousExerciseButtonClick
    );
    previousExerciseButton.addEventListener(
      "click",
      handlePreviousExerciseButtonClick
    );
  }

  function handleNextExerciseButtonClick() {
    outputFrame.srcdoc = "";

    currentExerciseIndex++;
    if (currentExerciseIndex < exercises.length) {
      const exercise = exercises[currentExerciseIndex];
      const params = new URLSearchParams(window.location.search);
      const topicId = params.get("topicId");
      console.log("Setting Curr in next: ",currentExerciseIndex);

      localStorage.setItem("currentExerciseIndex", currentExerciseIndex); // Save index in sessionStorage
      // window.location.href = `lesson.html?topicId=${topicId}&currentExerciseIndex=${currentExerciseIndex}`;
      loadExercise();
    } else {
      window.location.href = "index.html";
    }
  }

  function handlePreviousExerciseButtonClick() {
    outputFrame.srcdoc = "";

    currentExerciseIndex--;
    if (currentExerciseIndex >= 0) {
      console.log("Setting Curr in privios: ",currentExerciseIndex);

      localStorage.setItem("currentExerciseIndex", currentExerciseIndex); // Save index in sessionStorage
      loadExercise();
    } else {
      currentExerciseIndex = 0; // Ensure we don't go below 0
    }
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
    const topicId = params.get("topicId");
    if (!topicId) {
      alert("No topic selected");
      return;
    }

    exercises = await getExercises(topicId);
    exercises.sort((a, b) => a.order - b.order);

    if (exercises.length > 0) {
      try {
        const progress = await getAllProgress();
        // console.log("Fetched progress:", progress);

        // // Create a map for progress data based on exerciseId
        // const progressMap = progress.reduce((map, item) => {
        //   if (!map[item.exercise_id]) {
        //     map[item.exercise_id] = [];
        //   }
        //   map[item.exercise_id].push(item);
        //   return map;
        // }, {});

        // console.log("Progress Map:", progressMap); // Debugging output

        // Find the first incomplete exercise
        // const firstIncompleteExerciseIndex = exercises.findIndex((exercise) => {
        //   // Fetch progress for the current exercise
        //   const progressForExercise = progressMap[exercise.id] || [];

        //   // Check completeness based on tasks
        //   const tasksCount = exercise.tasks ? exercise.tasks.length : 0;
        //   const completedCount = progressForExercise.filter(
        //     (item) => item.completed
        //   ).length;

        //   // console.log(
        //   //   `Exercise ID: ${exercise.id}, Tasks Count: ${tasksCount}, Completed Count: ${completedCount}`
        //   // );

        //   // If there are tasks and completed count is less than tasks count, it's incomplete
        //   return tasksCount > 0 && completedCount < tasksCount;
        // });

        // console.log(
        //   "First Incomplete Exercise Index:",
        //   firstIncompleteExerciseIndex
        // ); // Debugging output

        // Set currentExerciseIndex to the first incomplete exercise, or default to 0 if all are complete
        // currentExerciseIndex =
        //   firstIncompleteExerciseIndex !== -1
        //     ? firstIncompleteExerciseIndex
        //     : 0;
          console.log("Setting Curr: ",currentExerciseIndex);
        // localStorage.setItem("currentExerciseIndex", currentExerciseIndex); // Save index in sessionStorage

        // console.log("Setting currentExerciseIndex to:", currentExerciseIndex); // Debugging output

        loadExercise();
      } catch (error) {
        // console.error("Error loading lesson:", error);
      }
    } else {
      lessonContent.innerHTML = "<p>No exercises available for this topic.</p>";
      taskContent.innerHTML = "";
      nextExerciseButton.disabled = true;
      previousExerciseButton.disabled = true;
    }
  }

  loadLesson();

  // Disable paste functionality in codeInput textarea
  codeInput.addEventListener("paste", (event) => {
    event.preventDefault();
    alert("Copying and pasting code is disabled in this field.");
  });
});
